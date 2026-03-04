-- Campaign banners table
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_key TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Public read access (banners are public content)
CREATE POLICY "Public read" ON banners FOR SELECT USING (true);

-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for banner storage
CREATE POLICY "Public read banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');
