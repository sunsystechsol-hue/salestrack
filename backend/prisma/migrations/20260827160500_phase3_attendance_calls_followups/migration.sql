-- AlterTable
ALTER TABLE "CallLog" ADD COLUMN "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_workDate_key" ON "Attendance"("userId", "workDate");

-- CreateIndex
CREATE INDEX "CallLog_nextFollowUp_idx" ON "CallLog"("nextFollowUp");
