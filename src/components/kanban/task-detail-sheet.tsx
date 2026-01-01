'use client';

import * as React from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Input,
  Button
} from "@/components/ui";
import { CalendarIcon, MessageSquare, Send, Github, Link as LinkIcon, Paperclip } from "lucide-react";
import type { Task, Project, UserProfile, Message } from "@/lib/data";
import { useCollection, useFirebase, useUser } from '@/firebase';
import { addMessage } from '@/firebase/firestore/mutations';
import { collection, query, orderBy, type Timestamp } from 'firebase/firestore';


const CommentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty."),
});
type CommentValues = z.infer<typeof CommentSchema>;


export function TaskDetailSheet({ open, onOpenChange, task, currentProject }: { open: boolean, onOpenChange: (open: boolean) => void, task: Task, currentProject: Project }) {
    const { firestore } = useFirebase();
    const { user: currentUser } = useUser();
    const { data: users } = useCollection<UserProfile>(firestore ? collection(firestore, 'users') : null);
    
    const messagesQuery = React.useMemo(() => {
        if (!firestore || !currentProject || !task) return null;
        return query(collection(firestore, 'projects', currentProject.id, 'tasks', task.id, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, currentProject, task]);

    const { data: messages } = useCollection<Message>(messagesQuery);

    const form = useForm<CommentValues>({
        resolver: zodResolver(CommentSchema),
        defaultValues: { text: "" }
    });

    const priorityColors = {
        low: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
        medium: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
        high: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",
    };
    
    const getInitials = (name?: string | null) => {
        if (name) {
            if (name.startsWith('0x')) return name.slice(2, 6);
            return name.split(' ').map(n => n[0]).join('');
        }
        return 'U';
    }

    const assignee = users?.find(u => u.uid === task.assigneeId);
    
    const getDueDate = (date: Timestamp | string | Date | null | undefined): Date | null => {
        if (!date) return null;
        if (typeof (date as Timestamp).toDate === 'function') {
            return (date as Timestamp).toDate();
        }
        return new Date(date as string | Date);
    }
    const dueDate = getDueDate(task.dueDate);

    const onSubmit = async (data: CommentValues) => {
        if (!firestore || !currentUser || !currentProject) return;
        try {
            await addMessage(firestore, currentProject.id, task.id, {
                text: data.text,
                authorId: currentUser.uid,
            });
            form.reset();
        } catch (error) {
            console.error("Failed to add comment:", error);
            // Here you might want to show a toast notification
        }
    };


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full flex flex-col">
                <SheetHeader>
                    <SheetTitle>{task.title}</SheetTitle>
                    <SheetDescription>
                        In project: {currentProject.name}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                        {task.description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Description</h3>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">Assignee:</h4>
                                {assignee ? (
                                    <div className='flex items-center gap-2'>
                                        <Avatar className="h-6 w-6" title={assignee.name || ''}>
                                            <AvatarImage src={assignee.avatarUrl || undefined} alt={assignee.name || ''} />
                                            <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className='text-sm text-muted-foreground'>{assignee.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Unassigned</span>
                                )}
                            </div>
                             <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">Priority:</h4>
                                <Badge variant="outline" className={`capitalize ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                            </div>
                            {dueDate && (
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold">Due Date:</h4>
                                    <span className='text-sm text-muted-foreground'>
                                        {format(dueDate, "PPP")}
                                    </span>
                                </div>
                            )}
                        </div>

                        {task.attachments && task.attachments.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                                    <h3 className="font-semibold">Attachments</h3>
                                </div>
                                <div className="space-y-2 pl-7">
                                    {task.attachments.map((att, index) => (
                                        <a key={index} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                            {att.type === 'github' && <Github className="h-4 w-4 shrink-0" />}
                                            {att.type === 'drive' && <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24"><path d="M12.8391 1.01172L12.839 1.01159C10.5937 1.01159 8.64797 2.45028 7.84659 4.43237L0.0117188 23.0116L7.84659 23.0117L10.092 17.5843L15.5937 7.57053L15.5938 7.5704L15.5937 7.57053L18.1534 12.4294L23.9883 12.4295L12.8391 1.01172Z" fill="#34A853"/><path d="M15.5938 7.5704L12.839 1.01159L7.84659 4.43237L10.092 17.5843L15.5938 7.5704Z" fill-opacity="0.1"/><path d="M0.0117188 23.0116L7.84659 23.0117L10.4062 17.5843H5.20325L0.0117188 23.0116Z" fill="#188038"/><path d="M7.84659 4.43237L5.20325 17.5843H10.092L7.84659 4.43237Z" fill-opacity="0.1"/><path d="M23.9883 12.4295L18.1534 12.4294L15.5937 7.57053L20.7967 7.57062L23.9883 12.4295Z" fill="#FBC02D"/><path d="M15.5937 7.57053L12.839 1.01159C13.4062 1.01159 13.9735 1.20336 14.4735 1.58691L15.5937 7.57053Z" fill-opacity="0.1"/><path d="M20.7967 7.57062L15.5937 7.57053L18.1534 12.4294H23.9883L20.7967 7.57062Z" fill-opacity="0.1"/><path d="M10.4062 17.5843L7.84659 23.0117C8.94797 23.0117 9.94797 22.6903 10.7493 22.113L10.4062 17.5843Z" fill-opacity="0.1"/><path d="M20.7967 7.57062L12.8391 1.01172C14.0204 1.01172 15.1344 1.39517 16.0204 2.03986L20.7967 7.57062Z" fill-opacity="0.1"/></svg>}
                                            {att.type === 'link' && <LinkIcon className="h-4 w-4 shrink-0" />}
                                            <span className="truncate underline">{att.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                <h3 className="font-semibold">Comments</h3>
                            </div>
                            <div className="space-y-4">
                                {messages?.map((message) => {
                                    const author = users?.find(u => u.uid === message.authorId);
                                    return (
                                        <div key={message.id} className="flex gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={author?.avatarUrl || undefined} />
                                                <AvatarFallback>{getInitials(author?.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{author?.name || 'Anonymous'}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{message.text}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {(!messages || messages.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser?.photoURL || undefined} />
                                <AvatarFallback>{getInitials(currentUser?.displayName)}</AvatarFallback>
                            </Avatar>
                            <Input {...form.register("text")} placeholder="Write a comment..." autoComplete="off" />
                            <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
