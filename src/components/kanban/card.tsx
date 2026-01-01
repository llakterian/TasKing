'use client';

import * as React from "react";
import type { Task, UserProfile, Project } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, AvatarImage, Badge } from "@/components/ui";
import { CalendarIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { TaskDetailSheet } from "./task-detail-sheet";
import type { Timestamp } from "firebase/firestore";

type KanbanCardProps = {
  task: Task;
  assignee?: UserProfile | null;
  currentProject: Project;
};

export function KanbanCard({ task, assignee, currentProject }: KanbanCardProps) {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const priorityColors = {
    low: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
  };

  const getInitials = (name?: string | null) => {
    if (name) {
      if (name.startsWith('0x')) return name.slice(0, 4);
      return name.split(' ').map(n => n[0]).join('');
    }
    return 'U';
  }

  const getDueDate = (date: Timestamp | string | Date | null | undefined): Date | null => {
    if (!date) return null;
    if (typeof (date as Timestamp).toDate === 'function') {
      return (date as Timestamp).toDate();
    }
    return new Date(date as string | Date);
  }

  const dueDate = getDueDate(task.dueDate);

  return (
    <>
    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer glassmorphism" onClick={() => setIsSheetOpen(true)}>
      <CardHeader className="p-4">
        <CardTitle className="text-base font-semibold leading-snug">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {dueDate && (
             <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span title={format(dueDate, "PPP")}>
                {formatDistanceToNow(dueDate, { addSuffix: true })}
              </span>
            </div>
          )}
          <Badge variant="outline" className={`capitalize ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          {assignee ? (
            <Avatar className="h-6 w-6" title={assignee.name || ''}>
              <AvatarImage src={assignee.avatarUrl || undefined} alt={assignee.name || ''} />
              <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
            </Avatar>
          ) : (
             <div className="h-6 w-6 rounded-full bg-muted border border-dashed" />
          )}
        </div>
      </CardContent>
    </Card>
    <TaskDetailSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} task={task} currentProject={currentProject} />
    </>
  );
}