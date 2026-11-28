-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('NEW', 'SOURCING', 'QUOTED', 'ACCEPTED', 'ORDERED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "custom" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customFees" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "custom" JSONB,
ADD COLUMN     "customFee" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ImportRequest" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "product" TEXT NOT NULL,
    "link" TEXT,
    "details" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "budget" INTEGER,
    "deadline" TEXT,
    "origin" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'NEW',
    "quotedPrice" INTEGER,
    "etaDays" INTEGER,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportRequest_number_key" ON "ImportRequest"("number");

-- AddForeignKey
ALTER TABLE "ImportRequest" ADD CONSTRAINT "ImportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
