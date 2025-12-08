/*
  Warnings:

  - You are about to drop the column `customer_name` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `orders` table. All the data in the column will be lost.
  - Added the required column `customer_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_type` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "customer_name",
DROP COLUMN "notes",
DROP COLUMN "status",
ADD COLUMN     "customer_id" INTEGER NOT NULL,
ADD COLUMN     "payment_type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
