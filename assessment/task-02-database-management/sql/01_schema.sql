-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('success', 'pending', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    -- Derived from id by the database (TXN-0001 style), so it can never drift or collide.
    "reference" TEXT GENERATED ALWAYS AS ('TXN-' || repeat('0', greatest(4 - length(id::text), 0)) || id::text) STORED NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'pending',
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_role_idx" ON "users"("is_active", "role");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "transactions_status_created_at_idx" ON "transactions"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data rules enforced by the database itself, as a second line of defence behind API validation.
-- Prisma cannot express CHECK constraints, so they live here in the migration.
ALTER TABLE "users"
  ADD CONSTRAINT "users_name_length" CHECK (char_length("name") BETWEEN 2 AND 100),
  ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email") AND char_length("email") <= 254);

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_amount_range" CHECK ("amount" > 0 AND "amount" <= 10000000),
  ADD CONSTRAINT "transactions_note_length" CHECK (char_length("note") <= 120);
