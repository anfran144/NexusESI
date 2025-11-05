import { createFileRoute } from '@tanstack/react-router';
import { TaskList } from '@/components/tasks/TaskList';

function TaskListPage() {
  const { committeeId } = Route.useParams();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Tareas del Comité</h1>
      <TaskList committeeId={parseInt(committeeId)} showFilters={true} showCreateButton={true} />
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/tasks/committee/$committeeId')({
  component: TaskListPage,
});
