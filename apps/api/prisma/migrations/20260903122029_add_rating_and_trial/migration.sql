-- AlterTable
ALTER TABLE "User" ADD COLUMN     "premiumTrialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventRating" (
    "id" TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRating_participationId_key" ON "EventRating"("participationId");

-- AddForeignKey
ALTER TABLE "EventRating" ADD CONSTRAINT "EventRating_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "Participation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
