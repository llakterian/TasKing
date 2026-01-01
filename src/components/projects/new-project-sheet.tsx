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
  Button,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useUser } from '@/firebase';
import { createProject } from '@/firebase/firestore/mutations';


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

    const form = useForm<FormValues>({
      resolver: zodResolver(FormSchema),
      defaultValues: {
        name: "",
        description: "",
      },
    });

    async function onSubmit(data: FormValues) {
        if (!firestore || !user) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in to create a project.",
            });
            return;
        }

        try {
            const newProject = await createProject(firestore, {
                name: data.name,
                ownerId: user.uid,
            });
            if (newProject) {
              toast({
                  title: "Project Created",
                  description: `The project "${data.name}" has been successfully created.`,
              });
              setOpen(false);
              form.reset();
            } else {
               throw new Error("createProject did not return the new project.");
            }

        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error Creating Project",
                description: "An unexpected error occurred. Please try again.",
            });
        }
    }


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{children}</span>
      <SheetContent className="sm:max-w-md w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Create New Project</SheetTitle>
          <SheetDescription>
            Fill in the details below to create a new project.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
         <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-4">
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
