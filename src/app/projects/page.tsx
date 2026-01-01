'use client';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { useCollection, useFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/data';
import { useMemo } from 'react';
import { NewProjectSheet } from '@/components/projects/new-project-sheet';


export default function ProjectsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const projectsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: projects, loading: projectsLoading } = useCollection<Project>(projectsQuery);
  
  if (projectsLoading) {
    return <div className="flex-1 p-4 sm:p-6"><p>Loading projects...</p></div>;
  }
  
  if (!user) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <p>Please sign in to see your projects.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <NewProjectSheet>
          <Button>New Project</Button>
        </NewProjectSheet>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => {
          return (
            <Card key={project.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className='space-y-1.5'>
                  <CardTitle>{project.name}</CardTitle>
                </div>
                <FolderKanban className="w-8 h-8 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View the project board and manage its tasks.</p>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="secondary" className="w-full">
                    <Link href="/dashboard">View Project</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
       {projects?.length === 0 && !projectsLoading && (
          <div className="text-center col-span-full">
            <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12">
                <FolderKanban className="w-12 h-12 text-muted-foreground/80" />
                <h3 className="text-xl font-semibold">No Projects Yet</h3>
                <p className="text-muted-foreground">Get started by creating your first project.</p>
                <NewProjectSheet>
                    <Button>Create a New Project</Button>
                </NewProjectSheet>
            </div>
          </div>
        )}
    </div>
  );
}
