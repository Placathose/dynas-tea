-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BundleProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bundleId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BundleProduct_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BundleProduct" ("bundleId", "createdAt", "id", "productId", "quantity", "updatedAt") SELECT "bundleId", "createdAt", "id", "productId", "quantity", "updatedAt" FROM "BundleProduct";
DROP TABLE "BundleProduct";
ALTER TABLE "new_BundleProduct" RENAME TO "BundleProduct";
CREATE INDEX "BundleProduct_bundleId_idx" ON "BundleProduct"("bundleId");
CREATE INDEX "BundleProduct_productId_idx" ON "BundleProduct"("productId");
CREATE UNIQUE INDEX "BundleProduct_bundleId_productId_key" ON "BundleProduct"("bundleId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
