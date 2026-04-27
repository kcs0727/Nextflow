-- CreateTable
CREATE TABLE "public"."Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "graphJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "selectedIds" JSONB,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NodeRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,

    CONSTRAINT "NodeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_userId_updatedAt_idx" ON "public"."Workflow"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_userId_startedAt_idx" ON "public"."WorkflowRun"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "NodeRun_runId_idx" ON "public"."NodeRun"("runId");

-- AddForeignKey
ALTER TABLE "public"."WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodeRun" ADD CONSTRAINT "NodeRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
