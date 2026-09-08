-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyEventReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyNewParticipants" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyRecommendations" BOOLEAN NOT NULL DEFAULT true;
