-- AlterEnum
ALTER TYPE "PlayerStatus" ADD VALUE 'registered';

-- AlterTable
ALTER TABLE "players" ALTER COLUMN "status" SET DEFAULT 'registered';
