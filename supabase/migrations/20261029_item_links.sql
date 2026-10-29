-- =========================================================================
-- OmniBrain: Ingestion-Time Cross-Cluster Item Links Migration
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.item_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  target_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0),
  match_reason TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT canonical_item_link_order CHECK (source_item_id < target_item_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS item_links_pair_unique_idx 
  ON public.item_links (source_item_id, target_item_id);

CREATE INDEX IF NOT EXISTS item_links_user_idx 
  ON public.item_links (user_id);

CREATE INDEX IF NOT EXISTS item_links_source_idx 
  ON public.item_links (source_item_id);

CREATE INDEX IF NOT EXISTS item_links_target_idx 
  ON public.item_links (target_item_id);

ALTER TABLE public.item_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_item_links_policy" ON public.item_links;
CREATE POLICY "user_item_links_policy" ON public.item_links FOR ALL 
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
