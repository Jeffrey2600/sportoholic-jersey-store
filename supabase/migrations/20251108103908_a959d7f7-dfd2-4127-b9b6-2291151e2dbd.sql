-- Add multiple images, sizes, and SKU to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sku text;

-- Create unique index on SKU
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON public.products(sku) WHERE sku IS NOT NULL;

-- Add SKU to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS product_sku text;

-- Update existing products to migrate single image to array
UPDATE public.products 
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Generate SKU for existing products that don't have one
UPDATE public.products
SET sku = 'PROD-' || UPPER(substring(id::text, 1, 8))
WHERE sku IS NULL;