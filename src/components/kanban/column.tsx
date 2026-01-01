import type { Status, Task, UserProfile, Project } from "@/lib/data";
import { KanbanCard } from "./card";

type KanbanColumnProps = {
  status: Status;
  tasks: Task[];
  users: UserProfile[];
  currentProject: Project;
};

export function KanbanColumn({ status, tasks, users, currentProject }: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-72 min-w-72">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">{status.name}</h2>
          <span className="text-sm font-medium bg-muted text-muted-foreground h-6 w-6 flex items-center justify-center rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
        {tasks.map((task) => {
           const assignee = users.find((user) => user.uid === task.assigneeId);
           return <KanbanCard key={task.id} task={task} assignee={assignee} currentProject={currentProject} />
        })}
      </div>
    </div>
  );
}
