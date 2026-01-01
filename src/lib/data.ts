import type { DocumentReference, Timestamp } from 'firebase/firestore';

export type Status = {
  id: "todo" | "in-progress" | "done" | "backlog";
  name: string;
};

export type UserProfile = {
  uid: string;
  name: string | null;
  avatarUrl: string | null;
  // email is not guaranteed with wallet-based auth
  email?: string | null;
};

export interface Project {
  id: string;
  name: string;
  ownerId: string;
}

export interface Attachment {
    type: 'github' | 'drive' | 'link';
    name: string;
    url: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status['id'];
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string | null;
  projectId: string;
  projectRef?: DocumentReference<Project>;
  dueDate?: Timestamp | string | null;
  attachments?: Attachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
    id: string;
    text: string;
    authorId: string;
    createdAt: Timestamp;
}
