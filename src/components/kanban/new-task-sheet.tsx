'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, UserCheck, Github, Link as LinkIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  Calendar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { statuses } from "@/lib/data-mock";
import { generateTaskDescription } from "@/ai/flows/generate-task-description";
import { recommendAssignee } from "@/ai/flows/recommend-assignee";
import { useCollection, useFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Project, UserProfile, Attachment } from '@/lib/data';
import { createTask } from '@/firebase/firestore/mutations';


const FormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string(),
  projectId: z.string().min(1, "Project is required."),
  status: z.string().min(1, "Status is required."),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.string().min(1, "Priority is required."),
});

type FormValues = z.infer<typeof FormSchema>;

const attachmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Please enter a valid URL'),
});

export function NewTaskSheet({ children, currentProject }: { children: React.ReactNode, currentProject?: Project }) {
    const [open, setOpen] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isRecommending, setIsRecommending] = React.useState(false);
    const [attachmentType, setAttachmentType] = React.useState<'github' | 'drive' | 'link' | null>(null);
    const [attachments, setAttachments] = React.useState<Attachment[]>([]);
    const [attachmentName, setAttachmentName] = React.useState('');
    const [attachmentUrl, setAttachmentUrl] = React.useState('');
    const [attachmentError, setAttachmentError] = React.useState<string | null>(null);

    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { user } = useUser();

    const projectsQuery = React.useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'projects'), where('ownerId', '==', user.uid));
    }, [firestore, user]);

    const { data: projects } = useCollection<Project>(projectsQuery);
    const { data: users } = useCollection<UserProfile>(firestore ? collection(firestore, 'users') : null);

    const form = useForm<FormValues>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        title: "",
        description: "",
        projectId: currentProject?.id || "",
        status: "todo",
        priority: "medium",
      },
    });
    
    React.useEffect(() => {
        if (currentProject) {
            form.setValue('projectId', currentProject.id);
        } else if (projects && projects.length > 0) {
            form.setValue('projectId', projects[0].id);
        }
    }, [projects, currentProject, form, open]);
    
    const resetAttachmentDialog = () => {
        setAttachmentType(null);
        setAttachmentName('');
        setAttachmentUrl('');
        setAttachmentError(null);
    };

    const handleAddAttachment = () => {
        const result = attachmentSchema.safeParse({ name: attachmentName, url: attachmentUrl });
        if (!result.success) {
            setAttachmentError(result.error.errors[0].message);
            return;
        }
        if (attachmentType) {
            setAttachments([...attachments, { type: attachmentType, name: attachmentName, url: attachmentUrl }]);
            resetAttachmentDialog();
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleGenerateDescription = async () => {
      const title = form.getValues("title");
      if (!title) {
        form.setError("title", { message: "Please enter a title first." });
        return;
      }
      setIsGenerating(true);
      try {
        const result = await generateTaskDescription({ taskTitle: title });
        form.setValue("description", result.taskDescription);
      } catch (error) {
        console.error("Failed to generate description:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate task description."
        });
      } finally {
        setIsGenerating(false);
      }
    };
    
    const handleRecommendAssignee = async () => {
      const { title, description, projectId, dueDate } = form.getValues();
      if (!title && !description) {
        toast({
          variant: "destructive",
          title: "Cannot Recommend",
          description: "Please provide a title or description for the task.",
        });
        return;
      }
  
      setIsRecommending(true);
      try {
        const teamMemberNames = users?.map(u => u.name || u.uid).join(', ');

        const result = await recommendAssignee({
          taskDescription: description || title,
          requiredSkills: [], 
          projectDetails: `Team members are: ${teamMemberNames}. Project: ${projects?.find(p => p.id === projectId)?.name || 'General'}`,
          taskDueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : 'Not specified',
        });
        
        const recommendedUser = users?.find(u => u.name === result.recommendedAssignee || u.uid === result.recommendedAssignee);

        if (recommendedUser) {
           form.setValue("assigneeId", recommendedUser.uid);
        }
        
        toast({
          title: "Assignee Recommended",
          description: `${result.recommendedAssignee}. Reason: ${result.reason}`,
        });

      } catch (error) {
        console.error("Failed to recommend assignee:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not recommend an assignee at this time."
        });
      } finally {
        setIsRecommending(false);
      }
    };

    async function onSubmit(data: FormValues) {
        if (!firestore) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Firestore is not available. Please try again later.",
            });
            return;
        }

        try {
            await createTask(firestore, {...data, attachments});
            toast({
                title: "Task Created",
                description: `The task "${data.title}" has been successfully created.`,
            });
            setOpen(false);
            form.reset({
                ...form.getValues(),
                title: "",
                description: "",
                assigneeId: undefined,
                dueDate: undefined,
            });
            setAttachments([]);

        } catch (error) {
            console.error("Error creating task:", error);
            toast({
                variant: "destructive",
                title: "Error Creating Task",
                description: "An unexpected error occurred. Please try again.",
            });
        }
    }

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{children}</span>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Create New Task</SheetTitle>
          <SheetDescription>
            Fill in the details below to create a new task.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
         <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <Button variant="ghost" size="sm" type="button" onClick={handleGenerateDescription} disabled={isGenerating}>
                    <Sparkles className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
            </div>
            <Textarea id="description" {...form.register("description")} className="min-h-[100px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select onValueChange={(value) => form.setValue('projectId', value)} value={form.watch('projectId')}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value)} defaultValue={form.getValues('status')}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                    <Label htmlFor="assignee">Assignee</Label>
                     <Button variant="ghost" size="sm" type="button" onClick={handleRecommendAssignee} disabled={isRecommending}>
                        <UserCheck className={cn("mr-2 h-4 w-4", isRecommending && "animate-spin")} />
                         {isRecommending ? 'Recommending...' : 'Recommend'}
                    </Button>
                </div>
              <Select onValueChange={(value) => form.setValue('assigneeId', value)} value={form.watch('assigneeId')}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.uid} value={user.uid}>{user.name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(value) => form.setValue('priority', value)} defaultValue={form.getValues('priority')}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("dueDate") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("dueDate") ? format(form.watch("dueDate")!, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("dueDate")}
                  onSelect={(date) => form.setValue("dueDate", date as Date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
           <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" type="button" className="h-12 w-12 flex-col gap-1" onClick={() => setAttachmentType('github')}>
                    <Github className="h-5 w-5" />
                    <span className="text-xs">GitHub</span>
                </Button>
                 <Button variant="outline" size="icon" type="button" className="h-12 w-12 flex-col gap-1" onClick={() => setAttachmentType('drive')}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8391 1.01172L12.839 1.01159C10.5937 1.01159 8.64797 2.45028 7.84659 4.43237L0.0117188 23.0116L7.84659 23.0117L10.092 17.5843L15.5937 7.57053L15.5938 7.5704L15.5937 7.57053L18.1534 12.4294L23.9883 12.4295L12.8391 1.01172Z" fill="#34A853"/><path d="M15.5938 7.5704L12.839 1.01159L7.84659 4.43237L10.092 17.5843L15.5938 7.5704Z" fill-opacity="0.1"/><path d="M0.0117188 23.0116L7.84659 23.0117L10.4062 17.5843H5.20325L0.0117188 23.0116Z" fill="#188038"/><path d="M7.84659 4.43237L5.20325 17.5843H10.092L7.84659 4.43237Z" fill-opacity="0.1"/><path d="M23.9883 12.4295L18.1534 12.4294L15.5937 7.57053L20.7967 7.57062L23.9883 12.4295Z" fill="#FBC02D"/><path d="M15.5937 7.57053L12.839 1.01159C13.4062 1.01159 13.9735 1.20336 14.4735 1.58691L15.5937 7.57053Z" fill-opacity="0.1"/><path d="M20.7967 7.57062L15.5937 7.57053L18.1534 12.4294H23.9883L20.7967 7.57062Z" fill-opacity="0.1"/><path d="M10.4062 17.5843L7.84659 23.0117C8.94797 23.0117 9.94797 22.6903 10.7493 22.113L10.4062 17.5843Z" fill-opacity="0.1"/><path d="M20.7967 7.57062L12.8391 1.01172C14.0204 1.01172 15.1344 1.39517 16.0204 2.03986L20.7967 7.57062Z" fill-opacity="0.1"/></svg>
                    <span className="text-xs">Drive</span>
                 </Button>
                <Button variant="outline" size="icon" type="button" className="h-12 w-12 flex-col gap-1" onClick={() => setAttachmentType('link')}>
                    <LinkIcon className="h-5 w-5" />
                    <span className="text-xs">Link</span>
                </Button>
            </div>
             {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                    {attachments.map((att, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 text-sm bg-muted p-2 rounded-md">
                           <div className='flex items-center gap-2 truncate'>
                            {att.type === 'github' && <Github className="h-4 w-4 shrink-0" />}
                            {att.type === 'drive' && <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24"><path d="M12.8391 1.01172L12.839 1.01159C10.5937 1.01159 8.64797 2.45028 7.84659 4.43237L0.0117188 23.0116L7.84659 23.0117L10.092 17.5843L15.5937 7.57053L15.5938 7.5704L15.5937 7.57053L18.1534 12.4294L23.9883 12.4295L12.8391 1.01172Z" fill="#34A853"/><path d="M15.5938 7.5704L12.839 1.01159L7.84659 4.43237L10.092 17.5843L15.5938 7.5704Z" fill-opacity="0.1"/><path d="M0.0117188 23.0116L7.84659 23.0117L10.4062 17.5843H5.20325L0.0117188 23.0116Z" fill="#188038"/><path d="M7.84659 4.43237L5.20325 17.5843H10.092L7.84659 4.43237Z" fill-opacity="0.1"/><path d="M23.9883 12.4295L18.1534 12.4294L15.5937 7.57053L20.7967 7.57062L23.9883 12.4295Z" fill="#FBC02D"/><path d="M15.5937 7.57053L12.839 1.01159C13.4062 1.01159 13.9735 1.20336 14.4735 1.58691L15.5937 7.57053Z" fill-opacity="0.1"/><path d="M20.7967 7.57062L15.5937 7.57053L18.1534 12.4294H23.9883L20.7967 7.57062Z" fill-opacity="0.1"/><path d="M10.4062 17.5843L7.84659 23.0117C8.94797 23.0117 9.94797 22.6903 10.7493 22.113L10.4062 17.5843Z" fill-opacity="0.1"/><path d="M20.7967 7.57062L12.8391 1.01172C14.0204 1.01172 15.1344 1.39517 16.0204 2.03986L20.7967 7.57062Z" fill-opacity="0.1"/></svg>}
                            {att.type === 'link' && <LinkIcon className="h-4 w-4 shrink-0" />}
                            <span className="truncate">{att.name}</span>
                           </div>
                           <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAttachment(index)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
        
        <SheetFooter className="pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </SheetFooter>
       </form>
      </SheetContent>
    </Sheet>

    <Dialog open={!!attachmentType} onOpenChange={(isOpen) => !isOpen && resetAttachmentDialog()}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Add {attachmentType} attachment</DialogTitle>
            <DialogDescription>
                Enter the name and URL for your attachment.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attachment-name" className="text-right">Name</Label>
                    <Input id="attachment-name" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attachment-url" className="text-right">URL</Label>
                    <Input id="attachment-url" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} className="col-span-3" />
                </div>
                {attachmentError && <p className="text-sm text-destructive col-span-4 text-center">{attachmentError}</p>}
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={resetAttachmentDialog}>Cancel</Button>
                <Button type="button" onClick={handleAddAttachment}>Add Attachment</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
