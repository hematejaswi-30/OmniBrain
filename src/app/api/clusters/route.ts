// src/app/api/clusters/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const SEED_CLUSTERS = [
  {
    cluster_name: 'Backend & Microservices',
    item_count: 4,
    count: 4,
    description: 'PostgreSQL replication, Docker Compose configurations, and pgvector schema indexing.',
    items: [
      { id: 'item_docker', title: 'Docker compose port fix', source_type: 'whatsapp', summary: 'Bind Redis port 6379 strictly to 127.0.0.1 in Docker Compose.' },
      { id: 'item_pgvector', title: 'Architecture_Spec.pdf', source_type: 'gdrive', summary: 'Configure HNSW vector indexes in PostgreSQL via pgvector extension.' },
    ],
    entities: ['PostgreSQL', 'Docker', 'Redis', 'pgvector'],
  },
  {
    cluster_name: 'Italian Culinary Techniques',
    item_count: 3,
    count: 3,
    description: 'Traditional Roman pasta emulsification secrets and ingredient selection.',
    items: [
      { id: 'item_carbonara', title: 'Creamy Carbonara without cream', source_type: 'instagram', summary: 'Emulsify carbonara off-heat at ~65°C using starchy pasta water.' },
    ],
    entities: ['Carbonara', 'Guanciale', 'Pecorino Romano'],
  },
  {
    cluster_name: 'Graphify & AI Architectures',
    item_count: 3,
    count: 3,
    description: 'Knowledge graph UX, spatial force-directed 2D canvas, and memory plane integration.',
    items: [
      { id: 'item_graphify', title: 'Graphify Codebase & Spec', source_type: 'web', summary: 'Persistent knowledge graph parsing engine for Antigravity workspace.' },
    ],
    entities: ['Graphify', 'Next.js', 'Force Canvas', 'Antigravity'],
  },
];

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(SEED_CLUSTERS, { status: 200 });
    }

    // Query items grouped by cluster_name
    const { data: items, error } = await supabase
      .from('items')
      .select('id, title, source_type, summary, cluster_name, is_bookmarked')
      .eq('user_id', user.id);

    if (error || !items || items.length === 0) {
      return NextResponse.json(SEED_CLUSTERS, { status: 200 });
    }

    // Group items in memory
    const clusterMap = new Map<string, any>();

    for (const item of items) {
      const clusterName = item.cluster_name || 'Uncategorized';
      if (!clusterMap.has(clusterName)) {
        clusterMap.set(clusterName, {
          cluster_name: clusterName,
          item_count: 0,
          count: 0,
          description: `Consolidated research topic for ${clusterName}.`,
          items: [],
          entities: new Set<string>(),
        });
      }

      const cluster = clusterMap.get(clusterName);
      cluster.item_count += 1;
      cluster.count += 1;
      cluster.items.push({
        id: item.id,
        title: item.title,
        source_type: item.source_type,
        summary: item.summary,
      });

      // Infer entities from source type and title words
      cluster.entities.add(item.source_type);
      if (item.title) {
        item.title.split(/\s+/).forEach((w: string) => {
          if (w.length > 4) cluster.entities.add(w.replace(/[^a-zA-Z0-9]/g, ''));
        });
      }
    }

    const clustersList = Array.from(clusterMap.values()).map(c => ({
      ...c,
      entities: Array.from(c.entities as Set<string>).slice(0, 5),
    })).sort((a, b) => b.item_count - a.item_count);

    return NextResponse.json(clustersList, { status: 200 });
  } catch (err) {
    return NextResponse.json(SEED_CLUSTERS, { status: 200 });
  }
}
