'use client';
import * as React from 'react';
import { AppLayout } from "@/components/app-layout";
import { useUser, useFirebase, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Project } from "@/lib/data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [currentProject, setCurrentProject] = React.useState<Project | undefined>(undefined);

  const projectsQuery = React.useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: projects } = useCollection<Project>(projectsQuery);

  React.useEffect(() => {
    if (projects && projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject]);

  if (!user) {
    return (
        <div className="flex flex-col min-h-svh">
             <div className="flex-1 flex flex-col min-h-0">
                {children}
            </div>
        </div>
    );
  }

  return (
    <AppLayout
      currentProject={currentProject}
      onProjectChange={setCurrentProject}
    >
      {React.cloneElement(children as React.ReactElement, { currentProject })}
    </AppLayout>
  );
}
