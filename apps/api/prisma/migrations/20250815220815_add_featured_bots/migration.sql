-- CreateEnum
CREATE TYPE "public"."BotCategory" AS ENUM ('ENTERTAINMENT', 'EDUCATIONAL', 'PRODUCTIVITY', 'CREATIVE', 'TECHNICAL', 'HISTORICAL', 'COMEDY');

-- AlterTable
ALTER TABLE "public"."bot_personalities" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."featured_bot_rotations" (
    "id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "bot_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featured_bot_rotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "featured_bot_rotations_week_start_key" ON "public"."featured_bot_rotations"("week_start");
