-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'athlete',
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;
