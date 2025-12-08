/*
  Warnings:

  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'STOCKTAKE');

-- AlterTable
ALTER TABLE "products" DROP COLUMN "stock",
ADD COLUMN     "current_stock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "datetime" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "type" "MovementType" NOT NULL,
    "reference" TEXT,
    "purchase_order_id" INTEGER,
    "notes" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_datetime_idx" ON "stock_movements"("datetime");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
