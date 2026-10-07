-- 1. Enable Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Items Table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('instagram', 'whatsapp', 'gdrive', 'web', 'text')),
  source_url TEXT,
  raw_content TEXT,
  title VARCHAR(120) NOT NULL,
  summary TEXT NOT NULL,
  cluster_name VARCHAR(60) NOT NULL,
  embedding vector(768),
  is_bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entities Table
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) UNIQUE NOT NULL
);

-- 4. Graph Edges Table
CREATE TABLE public.item_entities (
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, entity_id)
);

-- 5. Pinned Highlights Table
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  topic_cluster VARCHAR(60) NOT NULL,
  highlight_text TEXT NOT NULL,
  source_badge VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes & RLS
CREATE INDEX items_embedding_idx ON public.items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_items_policy" ON public.items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_highlights_policy" ON public.highlights FOR ALL USING (auth.uid() = user_id);
