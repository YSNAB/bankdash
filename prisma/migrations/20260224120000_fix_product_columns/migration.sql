-- Rename display_name to fullname
ALTER TABLE "products" RENAME COLUMN "display_name" TO "fullname";

-- Add selling_price column
ALTER TABLE "products" ADD COLUMN "selling_price" DOUBLE PRECISION;
