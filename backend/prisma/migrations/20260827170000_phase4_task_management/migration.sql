-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "dueAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");
