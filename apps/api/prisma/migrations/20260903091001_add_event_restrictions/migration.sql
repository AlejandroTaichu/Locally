-- CreateEnum
CREATE TYPE "EventGenderRestriction" AS ENUM ('male', 'female', 'all');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "genderRestriction" "EventGenderRestriction" NOT NULL DEFAULT 'all',
ADD COLUMN     "maxAge" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "minAge" INTEGER NOT NULL DEFAULT 13;
