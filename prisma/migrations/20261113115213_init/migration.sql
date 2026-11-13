-- CreateEnum
CREATE TYPE "PlayerCategory" AS ENUM ('casual', 'amateur', 'student');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('licensed', 'inactive');

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encoders" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,

    CONSTRAINT "encoders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "license_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "birthdate" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "category" "PlayerCategory" NOT NULL,
    "game_id" INTEGER NOT NULL,
    "game_other" TEXT,
    "photo_path" TEXT,
    "status" "PlayerStatus" NOT NULL DEFAULT 'licensed',
    "encoded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "encoders_username_key" ON "encoders"("username");

-- CreateIndex
CREATE UNIQUE INDEX "players_license_id_key" ON "players"("license_id");

-- CreateIndex
CREATE INDEX "idx_players_license" ON "players"("license_id");

-- CreateIndex
CREATE INDEX "idx_players_name" ON "players"("full_name");

-- CreateIndex
CREATE INDEX "idx_players_game" ON "players"("game_id");

-- CreateIndex
CREATE INDEX "idx_players_category" ON "players"("category");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_encoded_by_fkey" FOREIGN KEY ("encoded_by") REFERENCES "encoders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
