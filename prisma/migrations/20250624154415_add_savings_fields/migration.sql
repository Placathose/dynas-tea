-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bundle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageSource" TEXT,
    "sourceId" TEXT,
    "originalPrice" REAL NOT NULL,
    "discountedPrice" REAL NOT NULL,
    "savingsAmount" REAL NOT NULL DEFAULT 0,
    "savingsPercentage" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "shopId" TEXT NOT NULL,
    CONSTRAINT "Bundle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bundle" ("createdAt", "description", "discountedPrice", "id", "imageAlt", "imageSource", "imageUrl", "isActive", "originalPrice", "shopId", "sourceId", "title", "updatedAt") SELECT "createdAt", "description", "discountedPrice", "id", "imageAlt", "imageSource", "imageUrl", "isActive", "originalPrice", "shopId", "sourceId", "title", "updatedAt" FROM "Bundle";
DROP TABLE "Bundle";
ALTER TABLE "new_Bundle" RENAME TO "Bundle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
