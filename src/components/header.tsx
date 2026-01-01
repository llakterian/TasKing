'use client';
import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  SidebarTrigger,
} from "@/components/ui";
import { PlusCircle, Settings, LogOut } from "lucide-react";
import { TasKingLogo } from "./icons";
import { NewTaskSheet } from "./kanban/new-task-sheet";
import { useUser, useFirebase, useCollection } from "@/firebase";
import { signOut } from "@/firebase/auth/auth";
import { collection, query, where } from "firebase/firestore";
import type { Project } from "@/lib/data";

interface HeaderProps {
    onProjectChange: ((project: Project) => void) | undefined;
    currentProject: Project | undefined;
}

export function Header({ onProjectChange, currentProject }: HeaderProps) {
  const { user } = useUser();
  const { auth, firestore } = useFirebase();

  const projectsQuery = React.useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: projects } = useCollection<Project>(projectsQuery);

  React.useEffect(() => {
    if (projects && projects.length > 0 && !currentProject && onProjectChange) {
        onProjectChange(projects[0]);
    }
  }, [projects, currentProject, onProjectChange]);

  const handleProjectChange = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (project && onProjectChange) {
        onProjectChange(project);
    }
  }

  const handleSignOut = () => {
    if(auth) {
      signOut(auth);
    }
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      if (name.startsWith('0x')) return name.slice(2,6).toUpperCase();
      return name.split(' ').map(n => n[0]).join('');
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    if (user?.uid) {
      return user.uid.substring(0, 2);
    }
    return 'TK';
  }

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email;
    if (user?.uid) {
      return `${user.uid.substring(0,6)}...${user.uid.substring(user.uid.length - 4)}`
    }
    return "Anonymous User"
  }


  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-transparent px-4 backdrop-blur-lg sm:h-16 sm:px-6 glassmorphism">
      <SidebarTrigger className="md:hidden" />
      <div className="hidden items-center gap-2 md:flex">
        <TasKingLogo className="h-7 w-7 text-primary" />
        <span className="font-bold text-lg">TasKing</span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        {user && currentProject && projects && projects.length > 0 && (
          <div className="w-full max-w-[200px]">
            <Select onValueChange={handleProjectChange} value={currentProject.id}>
              <SelectTrigger className="h-9 truncate">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {user && (
          <NewTaskSheet currentProject={currentProject}>
            <Button size="sm" className="gap-2">
              <PlusCircle size={16} />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </NewTaskSheet>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || undefined} alt={getDisplayName()} />
                  <AvatarFallback>{getInitials(user.displayName || user.uid, user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">{getDisplayName()}</p>
                  {user.email && <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
