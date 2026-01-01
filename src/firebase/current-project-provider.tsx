'use client';

import * as React from 'react';
import type { Project } from '@/lib/data';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

interface ProjectContextType {
    currentProject: Project | undefined;
    setCurrentProject: (project: Project | undefined) => void;
    projects: Project[] | null;
    loading: boolean;
}

const ProjectContext = React.createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const [currentProject, setCurrentProject] = React.useState<Project | undefined>(undefined);

    const projectsQuery = React.useMemo(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'projects'), where('ownerId', '==', user.uid));
    }, [firestore, user]);

    const { data: projects, loading } = useCollection<Project>(projectsQuery);

    // Set default project if none selected
    React.useEffect(() => {
        if (projects && projects.length > 0 && !currentProject) {
            setCurrentProject(projects[0]);
        }
    }, [projects, currentProject]);

    return (
        <ProjectContext.Provider value={{ currentProject, setCurrentProject, projects, loading }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useCurrentProject() {
    const context = React.useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useCurrentProject must be used within a ProjectProvider');
    }
    return context;
}
