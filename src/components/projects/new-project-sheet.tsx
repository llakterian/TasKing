'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  Button,
  Input,
  Label,
  Textarea,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
} from "@/components/ui";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useUser, useCurrentProject } from '@/firebase';
import { createProject } from '@/firebase/firestore/mutations';
import type { Project } from '@/lib/data';


const FormSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export function NewProjectSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { setCurrentProject } = useCurrentProject();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
      dueDate: undefined,
    },
  });

  async function onSubmit(data: FormValues) {
    console.log('NewProjectSheet: Starting project creation...', data);
    if (!firestore || !user) {
      console.error('NewProjectSheet: Missing context', { firestore: !!firestore, user: !!user });
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a project.",
      });
      return;
    }

    try {
      console.log('NewProjectSheet: Calling createProject mutation...');
      const docRef = await createProject(firestore, {
        name: data.name,
        ownerId: user.uid,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      });

      console.log('NewProjectSheet: Project created successfully, ID:', docRef.id);

      // Fetch the mock project object to set it as current
      // Actually, we can just set it to undefined and the layout's useEffect will pick up the new project
      // Or we construct a partial Project object.
      const newProj: Project = {
        id: docRef.id,
        name: data.name,
        ownerId: user.uid,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      };
      setCurrentProject(newProj);

      toast({
        title: "Project Created",
        description: `The project "${data.name}" has been successfully created.`,
      });
      setOpen(false);
      form.reset();

    } catch (error: any) {
      console.error('NewProjectSheet: Failed to create project:', error);

      let description = `Failed to create project: ${error.message}`;
      let title = "Error Creating Project";

      // Check for common connectivity/blocking indicators
      const isNetworkError =
        error.message.includes('offline') ||
        error.message.includes('Failed to fetch') ||
        error.code === 'unavailable' ||
        error.code === 'failed-precondition';

      if (isNetworkError) {
        title = "Connection Blocked";
        description = "Your connection to the database seems to be blocked. Please disable any ad-blockers or privacy extensions for this site and try again.";
      }

      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    }
  }


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-md w-full flex flex-col pt-10">
        <SheetHeader>
          <SheetTitle>Create New Project</SheetTitle>
          <SheetDescription>
            Fill in the details below to create a new project.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Q3 Marketing Campaign" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" {...form.register("description")} className="min-h-[100px]" placeholder="A brief description of what this project is about." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Target End Date (Optional)</Label>
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
                    {mounted && form.watch("dueDate") ? format(form.watch("dueDate")!, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("dueDate") || undefined}
                    onSelect={(date) => {
                      form.setValue("dueDate", date || undefined);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
