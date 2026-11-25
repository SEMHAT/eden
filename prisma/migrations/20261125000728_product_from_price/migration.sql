-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "fromPrice" INTEGER;

-- CreateIndex
CREATE INDEX "Product_fromPrice_idx" ON "Product"("fromPrice");
