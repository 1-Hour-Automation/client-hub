-- Create storage bucket for campaign files
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-files', 'campaign-files', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload campaign files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-files' AND auth.role() = 'authenticated');

-- Allow public read access to campaign files
CREATE POLICY "Public read access to campaign files"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-files');

-- Allow internal users to delete campaign files
CREATE POLICY "Internal users can delete campaign files"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-files' AND public.is_internal_user(auth.uid()));