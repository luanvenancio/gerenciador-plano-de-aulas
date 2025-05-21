/*
  Warnings:

  - The primary key for the `LessonPlan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `LessonPlan` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LessonPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "originalFileName" TEXT NOT NULL,
    "originalFilePath" TEXT NOT NULL,
    "newPdfFilePath" TEXT,
    "objectives" TEXT,
    "content" TEXT,
    "methodology" TEXT,
    "activities" TEXT,
    "resources" TEXT,
    "evaluation" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LessonPlan" ("activities", "content", "createdAt", "evaluation", "id", "methodology", "newPdfFilePath", "objectives", "observations", "originalFileName", "originalFilePath", "resources", "title", "updatedAt") SELECT "activities", "content", "createdAt", "evaluation", "id", "methodology", "newPdfFilePath", "objectives", "observations", "originalFileName", "originalFilePath", "resources", "title", "updatedAt" FROM "LessonPlan";
DROP TABLE "LessonPlan";
ALTER TABLE "new_LessonPlan" RENAME TO "LessonPlan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
