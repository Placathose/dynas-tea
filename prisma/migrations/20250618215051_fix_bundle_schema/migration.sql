/*
  Warnings:

  - The primary key for the `Bundle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `targetProducts` on the `Bundle` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Bundle` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `BundleProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `bundleId` on the `BundleProduct` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `BundleProduct` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- CreateTable
CREATE TABLE "TargetProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "productTitle" TEXT,
    "productImage" TEXT,
    "productAlt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bundleId" INTEGER NOT NULL,
    CONSTRAINT "TargetProduct_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bundle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "originalPrice" REAL NOT NULL,
    "discountedPrice" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "shopId" TEXT NOT NULL,
    CONSTRAINT "Bundle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bundle" ("createdAt", "description", "discountedPrice", "id", "imageUrl", "isActive", "originalPrice", "shopId", "title", "updatedAt") SELECT "createdAt", "description", "discountedPrice", "id", "imageUrl", "isActive", "originalPrice", "shopId", "title", "updatedAt" FROM "Bundle";
DROP TABLE "Bundle";
ALTER TABLE "new_Bundle" RENAME TO "Bundle";
CREATE TABLE "new_BundleProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bundleId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BundleProduct_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BundleProduct" ("bundleId", "createdAt", "id", "productId", "quantity", "updatedAt") SELECT "bundleId", "createdAt", "id", "productId", "quantity", "updatedAt" FROM "BundleProduct";
DROP TABLE "BundleProduct";
ALTER TABLE "new_BundleProduct" RENAME TO "BundleProduct";
CREATE INDEX "BundleProduct_bundleId_idx" ON "BundleProduct"("bundleId");
CREATE INDEX "BundleProduct_productId_idx" ON "BundleProduct"("productId");
CREATE UNIQUE INDEX "BundleProduct_bundleId_productId_key" ON "BundleProduct"("bundleId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TargetProduct_bundleId_key" ON "TargetProduct"("bundleId");
