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
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useUser, useCurrentProject } from '@/firebase';
import { createProject } from '@/firebase/firestore/mutations';
import type { Project } from '@/lib/data';


const FormSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export function NewProjectSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { setCurrentProject } = useCurrentProject();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
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
      });

      console.log('NewProjectSheet: Project created successfully, ID:', docRef.id);

      // Fetch the mock project object to set it as current
      // Actually, we can just set it to undefined and the layout's useEffect will pick up the new project
      // Or we construct a partial Project object.
      const newProj = { id: docRef.id, name: data.name, ownerId: user.uid } as Project;
      setCurrentProject(newProj);

      toast({
        title: "Project Created",
        description: `The project "${data.name}" has been successfully created.`,
      });
      setOpen(false);
      form.reset();

    } catch (error: any) {
      console.error('NewProjectSheet: Failed to create project:', error);
      toast({
        variant: "destructive",
        title: "Error Creating Project",
        description: `Failed to create project: ${error.message}`,
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
