import type { Task, Status, UserProfile } from "@/lib/data";
import { KanbanColumn } from "./column";
import { useCurrentProject } from "@/firebase";

type KanbanBoardProps = {
  tasks: Task[] | null;
  statuses: Status[];
  users: UserProfile[];
};

export function KanbanBoard({ tasks, statuses, users }: KanbanBoardProps) {
  const { currentProject } = useCurrentProject();
  if (!currentProject) return null;

  return (
    <div className="flex gap-6">
      {statuses.map((status) => {
        const tasksInStatus = tasks?.filter((task) => task.status === status.id) || [];
        return (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={tasksInStatus}
            users={users}
          />
        );
      })}
    </div>
  );
}
