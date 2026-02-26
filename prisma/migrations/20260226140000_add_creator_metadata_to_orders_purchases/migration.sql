ALTER TABLE "orders"
ADD COLUMN "created_by_user_id" TEXT,
ADD COLUMN "is_pos_order" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "purchases"
ADD COLUMN "created_by_user_id" TEXT;
