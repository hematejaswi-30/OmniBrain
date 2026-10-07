// src/app/api/synthesize/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@/lib/supabase/server';

// Pre-compiled starter briefs for instant preview on empty databases
const DEMO_BRIEFS: Record<string, string> = {
  'Graphify & AI': `### Knowledge Graph UX & Architecture

**Executive Overview**
The architecture integrates a spatial force-directed 2D canvas with localized LLM entity extraction. Instead of dumping raw chat logs, nodes are connected by shared concepts and semantic proximity.

**Key Architectural Directives**
• **Dynamic Imports**: \`react-force-graph-2d\` is isolated with \`ssr: false\` to eliminate Canvas hydration mismatches and keep initial bundle < 180 KB.
• **Entity Association**: Graph edges are drawn from shared extracted entities, creating organic cluster boundaries.
• **Progressive Disclosure**: Clicking a cluster hub surfaces an executive briefing note rather than exposing raw graph query code.

**Primary Sources Cited**
• *Web Link*: Graphify Repository & Architecture Paper
• *WhatsApp Dev*: Canvas 60 FPS performance optimizations`,

  'Backend & Systems': `### Backend & Microservices Architecture

**Executive Overview**
The infrastructure standardizes on PostgreSQL with pgvector for spatial cluster search, paired with Prisma client for type-safe relational mapping. Redis handles rate-limited LLM inference jobs.

**Key Directives**
• **Redis Port Binding**: Ensure Redis port 6379 in Docker Compose is bound to 127.0.0.1 to avoid public exposure.
• **Database Extensions**: Run \`CREATE EXTENSION IF NOT EXISTS vector;\` during migration.
• **Rate-Limiting Buffer**: Ingestion queue enforces 4.5s spacing to stay under Gemini 15 RPM limits.

**Primary Sources Cited**
• *WhatsApp Dev Chat #41*: Docker compose configuration
• *Google Drive*: Architecture_Spec.pdf`,

  'Italian Cooking': `### Master Recipe Brief: Authentic Carbonara

**Executive Overview**
Traditional Roman Carbonara relies exclusively on an emulsion of egg yolks, finely grated Pecorino Romano, and starchy pasta cooking water. Heavy cream, garlic, and peas are strictly excluded.

**Preparation Steps**
• **Guanciale Rendering**: Crisp cured pork jowl slowly over medium-low heat until golden; set aside rendered fat for emulsification.
• **The Egg Mixture**: Whisk 3 egg yolks + 1 whole egg with 60g Pecorino Romano and freshly cracked toasted black pepper.
• **Off-Heat Emulsification**: Never add eggs over direct flame. Toss pasta in fat off-heat at ~65°C, then incorporate egg slurry with starchy water.

**Primary Sources Cited**
• *Instagram Reel*: @chef_marco Roman technique
• *WhatsApp Voice Note*: Mom's Pecorino selection advice`,
};

export async function POST(req: Request) {
  try {
    const { clusterName } = await req.json();

    if (!clusterName) {
      return NextResponse.json({ error: 'Cluster name is required' }, { status: 400 });
    }

    // 1. Try querying Supabase for user's live saved items
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let items: any[] = [];
    if (user) {
      const { data } = await supabase
        .from('items')
        .select('title, summary, source_type')
        .eq('user_id', user.id)
        .ilike('cluster_name', `%${clusterName}%`);
      items = data || [];
    }

    // 2. If no items in DB or no Gemini key, return starter demo brief
    const apiKey = process.env.GEMINI_API_KEY;
    if (items.length === 0 || !apiKey) {
      const brief = DEMO_BRIEFS[clusterName] || DEMO_BRIEFS['Graphify & AI'];
      return NextResponse.json({ synthesis: brief });
    }

    // 3. Live synthesis with Gemini 1.5 Flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an executive research assistant for OmniBrain. Synthesize the following ${items.length} items from the "${clusterName}" cluster into a concise, professional briefing note.

SOURCES:
${items.map((it, idx) => `[Source ${idx + 1} -${it.source_type}]: ${it.title} -${it.summary}`).join('\n')}

Format with:
### [Cluster Title]
**Executive Overview** (2 sentences)
**Key Directives** (Bullet points)
**Primary Sources Cited**
Tone: High-density, professional, direct, zero marketing fluff.
    `;

    const result = await model.generateContent(prompt);
    const synthesisText = result.response.text();

    return NextResponse.json({ synthesis: synthesisText });
  } catch (error: any) {
    // Graceful fallback to demo brief on error
    return NextResponse.json({
      synthesis: DEMO_BRIEFS['Graphify & AI'] || 'Synthesis generated.',
    });
  }
}
