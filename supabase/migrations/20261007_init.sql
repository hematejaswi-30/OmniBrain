-- =========================================================================
-- OmniBrain: PostgreSQL + pgvector Database Schema
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =========================================================================

-- 1. Enable pgvector extension for 768-dimensional AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Items Table: Ingested source notes, markdown specs, and media
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('instagram', 'whatsapp', 'gdrive', 'web', 'text', 'document')),
  source_url TEXT,
  raw_content TEXT,
  title VARCHAR(120) NOT NULL,
  summary TEXT NOT NULL,
  cluster_name VARCHAR(60) NOT NULL,
  embedding vector(768),
  is_bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entities Table: Extracted knowledge tags & semantic entities
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) UNIQUE NOT NULL
);

-- 4. Graph Edges Table: Links items to entity nodes
CREATE TABLE IF NOT EXISTS public.item_entities (
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, entity_id)
);

-- 5. Pinned Highlights Table: Quick-access directives & executive notes
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  topic_cluster VARCHAR(60) NOT NULL,
  highlight_text TEXT NOT NULL,
  source_badge VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. High-Performance HNSW Vector Index (No training data needed)
CREATE INDEX IF NOT EXISTS items_embedding_hnsw_idx 
  ON public.items USING hnsw (embedding vector_cosine_ops);

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_entities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their data, while permitting demo guest reads
DROP POLICY IF EXISTS "user_items_policy" ON public.items;
CREATE POLICY "user_items_policy" ON public.items FOR ALL 
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "user_highlights_policy" ON public.highlights;
CREATE POLICY "user_highlights_policy" ON public.highlights FOR ALL 
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "entities_policy" ON public.entities;
CREATE POLICY "entities_policy" ON public.entities FOR ALL 
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "item_entities_policy" ON public.item_entities;
CREATE POLICY "item_entities_policy" ON public.item_entities FOR ALL 
  USING (true) WITH CHECK (true);

-- 8. Cosine Similarity Vector Match Function (pgvector RPC)
CREATE OR REPLACE FUNCTION match_items (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  cluster_name text,
  source_type text,
  source_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    items.id,
    items.title::text,
    items.summary::text,
    items.cluster_name::text,
    items.source_type::text,
    items.source_url::text,
    1 - (items.embedding <=> query_embedding) AS similarity
  FROM public.items
  WHERE (p_user_id IS NULL OR items.user_id = p_user_id)
    AND items.embedding IS NOT NULL
    AND 1 - (items.embedding <=> query_embedding) > match_threshold
  ORDER BY items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
