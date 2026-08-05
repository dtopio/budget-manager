-- CreateIndex
CREATE INDEX "RecurringTransaction_active_nextRunDate_idx" ON "RecurringTransaction"("active", "nextRunDate");
