-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('male', 'female');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" "UserGender";
