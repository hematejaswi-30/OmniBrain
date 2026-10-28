// src/app/api/search/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

interface SeedItem {
  id: string;
  title: string;
  source_type: string;
  summary: string;
  raw_content: string;
  source_url?: string;
  keywords: string[];
}

const SEED_KNOWLEDGE: SeedItem[] = [
  {
    id: 'item_docker',
    title: 'WhatsApp: Docker Port 6379',
    source_type: 'whatsapp',
    summary: 'Bind Redis port 6379 strictly to 127.0.0.1 in Docker Compose to prevent unauthorized external access.',
    raw_content: 'WhatsApp Dev Chat #41: Hey team, make sure we bind Redis port 6379 to 127.0.0.1:6379 in our docker-compose.yml so we don\'t expose the cache server publicly.',
    keywords: ['docker', 'redis', 'port', '6379', 'cache', 'security', 'compose', 'bind', 'network', 'fix'],
  },
  {
    id: 'doc_arch',
    title: 'Architecture_Spec.md',
    source_type: 'document',
    summary: 'Configure HNSW vector indexes in PostgreSQL via pgvector extension with cosine distance metrics.',
    raw_content: '# Architecture Spec\nCREATE EXTENSION IF NOT EXISTS vector;\nCREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);\nRedis port 6379 bound strictly to localhost.',
    keywords: ['hnsw', 'vector', 'pgvector', 'postgres', 'postgresql', 'embedding', 'cosine', 'database', 'sql', 'index'],
  },
  {
    id: 'item_carbonara',
    title: 'Instagram: Pasta Reel',
    source_type: 'instagram',
    summary: 'Emulsify carbonara sauce off-heat at ~65°C using starchy pasta water, egg yolks, and Pecorino Romano. No cream allowed.',
    raw_content: 'Instagram Reel Caption: Traditional Roman Carbonara with guanciale, egg yolks, and Pecorino Romano. Emulsify off heat with starchy pasta water at ~65°C. Strictly no heavy cream or garlic!',
    source_url: 'https://instagram.com/reel/C8_pasta_carbonara',
    keywords: ['carbonara', 'pasta', 'pecorino', 'guanciale', 'egg', 'cooking', 'recipe', 'italian', 'emulsify', 'cream'],
  },
  {
    id: 'item_graphify',
    title: 'Web: Graphify Codebase',
    source_type: 'web',
    summary: 'Structural knowledge graph parsing engine for AI agent workspaces and persistent memory planes.',
    raw_content: 'Graphify Repository: Persistent knowledge graph memory plane for Antigravity IDE and Agent Manager. Fast AST parsing with community clustering.',
    source_url: 'https://github.com/graphify/graphifyy',
    keywords: ['graphify', 'graph', 'ast', 'knowledge', 'agent', 'memory', 'antigravity', 'spatial', 'constellation'],
  },
  {
    id: 'doc_agents',
    title: 'AGENTS.md',
    source_type: 'document',
    summary: 'Antigravity agent behavioral directives, Next.js 16 conventions, and Turbopack dev guidelines.',
    raw_content: '# AGENTS.md Guidelines: Always inspect graphify knowledge graph at graphify-out/ before answering. Use Next.js 16 App Router and dynamic imports with ssr: false for Canvas.',
    keywords: ['agents', 'guidelines', 'directives', 'turbopack', 'ssr', 'canvas', 'rules', 'antigravity'],
  },
  {
    id: 'doc_readme',
    title: 'README.md',
    source_type: 'document',
    summary: 'OmniBrain core architecture spec, Graphify memory plane integration, and multi-source routing directives.',
    raw_content: '# OmniBrain Workspace: Universal Ingestion Dock with regex routing, 2D Constellation Force Canvas, and multi-source synthesis.',
    keywords: ['omnibrain', 'readme', 'dock', 'omnibox', 'architecture', 'overview', 'workspace'],
  },
];

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    const queryLower = trimmedQuery.toLowerCase();
    const queryWords = queryLower.split(/\W+/).filter(w => w.length > 2);

    // 1. Check for logged-in user and query Supabase
    const supabase = await createServerClient();
    const user = await getAuthUser(supabase);

    let candidateSources: Array<{
      id: string;
      title: string;
      source_type: string;
      summary: string;
      raw_content: string;
      score: number;
    }> = [];

    if (user) {
      const { data: dbItems } = await supabase
        .from('items')
        .select('id, title, source_type, summary, raw_content, cluster_name')
        .eq('user_id', user.id);

      if (dbItems && dbItems.length > 0) {
        candidateSources = dbItems.map(item => {
          let score = 0;
          const text = `${item.title} ${item.summary} ${item.raw_content || ''} ${item.cluster_name}`.toLowerCase();
          queryWords.forEach(word => {
            if (text.includes(word)) score += 1;
          });
          return {
            id: item.id,
            title: item.title,
            source_type: item.source_type,
            summary: item.summary,
            raw_content: item.raw_content || item.summary,
            score,
          };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
      }
    }

    // 2. If no DB matches or guest user, match against seed knowledge
    if (candidateSources.length === 0) {
      candidateSources = SEED_KNOWLEDGE.map(item => {
        let score = 0;
        const text = `${item.title} ${item.summary} ${item.raw_content} ${item.keywords.join(' ')}`.toLowerCase();
        queryWords.forEach(word => {
          if (text.includes(word)) score += 2;
        });
        item.keywords.forEach(kw => {
          if (queryLower.includes(kw)) score += 3;
        });
        return {
          id: item.id,
          title: item.title,
          source_type: item.source_type,
          summary: item.summary,
          raw_content: item.raw_content,
          score,
        };
      }).sort((a, b) => b.score - a.score);
    }

    // Top relevant sources (up to 3)
    const topMatches = candidateSources.slice(0, 3);
    const primaryMatch = topMatches[0] || SEED_KNOWLEDGE[0];

    const citations = topMatches.map(m => ({
      id: m.id,
      title: m.title,
      source_type: m.source_type,
      snippet: m.summary,
    }));

    // 3. AI Synthesis
    const apiKey = process.env.GEMINI_API_KEY;
    let answerText = '';

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are OmniBrain, an executive AI personal knowledge assistant.
A user asked the following question about their saved knowledge items:
"${trimmedQuery}"

RELEVANT KNOWLEDGE SOURCES:
${topMatches.map((m, idx) => `[Source ${idx + 1} - ${m.source_type} (${m.title})]: ${m.raw_content}`).join('\n\n')}

INSTRUCTIONS:
1. Provide a direct, high-density, 2-3 sentence answer answering the user's question directly.
2. Directly reference the specific source (e.g. "According to your WhatsApp chat..." or "In your Architecture spec...").
3. Avoid generic pleasantries or fluff. Be authoritative and clear.`;

        const result = await model.generateContent(prompt);
        answerText = result.response.text();
      } catch (aiErr) {
        console.warn('Gemini search synthesis fallback:', aiErr);
      }
    }

    // Fallback answer generation if no API key or AI call fails
    if (!answerText) {
      if (queryLower.includes('redis') || queryLower.includes('docker') || queryLower.includes('port')) {
        answerText = `In your WhatsApp Dev Chat (#41), the team established that Redis port 6379 must be bound strictly to 127.0.0.1 in docker-compose.yml to eliminate external security exposure.`;
      } else if (queryLower.includes('carbonara') || queryLower.includes('pasta') || queryLower.includes('cook')) {
        answerText = `According to your saved Instagram Reel, authentic Roman Carbonara requires emulsifying starchy pasta water, egg yolks, and Pecorino Romano off-heat at ~65°C. No cream or garlic is allowed.`;
      } else if (queryLower.includes('vector') || queryLower.includes('pgvector') || queryLower.includes('index')) {
        answerText = `Per Architecture_Spec.md, vector search runs on PostgreSQL via the pgvector extension using HNSW indexes with cosine distance metrics (vector_cosine_ops).`;
      } else {
        answerText = `Based on your knowledge base in "${primaryMatch.title}": ${primaryMatch.summary}`;
      }
    }

    return NextResponse.json({
      success: true,
      query: trimmedQuery,
      answer: answerText,
      citations,
      focusedNodeId: primaryMatch.id,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
