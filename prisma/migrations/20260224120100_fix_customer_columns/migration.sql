-- Add missing columns to customers table
ALTER TABLE "customers" ADD COLUMN "company_name" TEXT;
ALTER TABLE "customers" ADD COLUMN "location" TEXT;
