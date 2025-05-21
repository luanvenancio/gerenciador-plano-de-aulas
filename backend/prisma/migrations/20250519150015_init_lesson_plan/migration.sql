-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "originalFileName" TEXT NOT NULL,
    "originalFilePath" TEXT NOT NULL,
    "newPdfFilePath" TEXT,
    "userId" TEXT,
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
