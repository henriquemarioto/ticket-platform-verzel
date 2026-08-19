/*
  Warnings:

  - Added the required column `entryStartTime` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "entryStartTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "street" TEXT;

-- CreateTable
CREATE TABLE "event_gatekeepers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "gatekeeperId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_gatekeepers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_gatekeepers_eventId_gatekeeperId_key" ON "event_gatekeepers"("eventId", "gatekeeperId");

-- AddForeignKey
ALTER TABLE "event_gatekeepers" ADD CONSTRAINT "event_gatekeepers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_gatekeepers" ADD CONSTRAINT "event_gatekeepers_gatekeeperId_fkey" FOREIGN KEY ("gatekeeperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
