'use client';
import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
  type DocumentReference,
} from 'firebase/firestore';
import type { Task, Project, Message, Attachment } from '@/lib/data';

type NewTaskPayload = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'projectRef' 
> & { attachments: Attachment[] };

export async function createTask(
  firestore: Firestore,
  taskData: NewTaskPayload
): Promise<DocumentReference> {
  try {
    const projectRef = collection(firestore, 'projects', taskData.projectId, 'tasks');
    const docRef = await addDoc(projectRef, {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task.');
  }
}

type NewProjectPayload = Omit<Project, 'id'>;

export async function createProject(
  firestore: Firestore,
  projectData: NewProjectPayload
): Promise<DocumentReference<Project>> {
  try {
    const projectCollection = collection(firestore, 'projects');
    const docRef = await addDoc(projectCollection, projectData);
    return docRef as DocumentReference<Project>;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project.');
  }
}

type NewMessagePayload = Omit<Message, 'id' | 'createdAt'>

export async function addMessage(
    firestore: Firestore,
    projectId: string,
    taskId: string,
    messageData: NewMessagePayload
): Promise<DocumentReference> {
    try {
        const messagesCollection = collection(firestore, 'projects', projectId, 'tasks', taskId, 'messages');
        const docRef = await addDoc(messagesCollection, {
            ...messageData,
            createdAt: serverTimestamp(),
        });
        return docRef;
    } catch (error) {
        console.error('Error adding message:', error);
        throw new Error('Failed to add message.');
    }
}
