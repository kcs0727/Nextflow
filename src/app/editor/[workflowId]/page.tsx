import { WorkflowBuilder } from "@/components/workflow-builder";

type EditorPageProps = {
  params: Promise<{ workflowId: string }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { workflowId } = await params;
  return <WorkflowBuilder workflowId={workflowId === "new" ? undefined : workflowId} />;
}