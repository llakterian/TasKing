import type { Status } from './data';

const mockData = {
  statuses: [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "To Do" },
    { id: "in-progress", name: "In Progress" },
    { id: "done", name: "Done" }
  ] as Status[],
};

export const statuses: Status[] = mockData.statuses;
