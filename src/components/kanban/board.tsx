import type { Task, Status, UserProfile, Project } from "@/lib/data";
import { KanbanColumn } from "./column";

type KanbanBoardProps = {
  tasks: Task[] | null;
  statuses: Status[];
  users: UserProfile[];
  currentProject: Project;
};

export function KanbanBoard({ tasks, statuses, users, currentProject }: KanbanBoardProps) {
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
            currentProject={currentProject}
          />
        );
      })}
    </div>
  );
}
