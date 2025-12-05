-- Add compare_at_price column to products table for showing original/strikethrough price
ALTER TABLE public.products ADD COLUMN compare_at_price numeric NULL;

-- Create banners table for hero carousel management
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text,
  cta_link text,
  image_url text,
  bg_color text DEFAULT '#1a1a2e',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Banners are viewable by everyone
CREATE POLICY "Banners are viewable by everyone"
ON public.banners
FOR SELECT
USING (true);

-- Only admins can insert banners
CREATE POLICY "Admins can insert banners"
ON public.banners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update banners
CREATE POLICY "Admins can update banners"
ON public.banners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete banners
CREATE POLICY "Admins can delete banners"
ON public.banners
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();