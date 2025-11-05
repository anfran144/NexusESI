import { createFileRoute } from '@tanstack/react-router';
import { AlertList } from '@/components/alerts/AlertList';

function TaskAlertsPage() {
  const { taskId } = Route.useParams();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Alertas de la Tarea</h1>
      <AlertList taskId={parseInt(taskId)} showFilters={true} />
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/tasks/$taskId/alerts')({
  component: TaskAlertsPage,
});
