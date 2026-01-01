
'use client';
import { useMemo } from 'react';
import { Button } from "@/components/ui";
import { KanbanBoard } from "@/components/kanban/board";
import { useUser, useFirebase, useCollection } from "@/firebase";
import { signInWithEVMWallet } from "@/firebase/auth/auth";
import { Wallet } from "lucide-react";
import { collection } from "firebase/firestore";
import type { Project, Task, Status, UserProfile } from "@/lib/data";

// Mock statuses for now, can be moved to Firestore later
const statuses: Status[] = [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "To Do" },
    { id: "in-progress", name: "In Progress" },
    { id: "done", name: "Done" }
  ];

export default function DashboardPage({ currentProject }: { currentProject?: Project }) {
  const { user, loading: userLoading } = useUser();
  const { auth, firestore, loading: firebaseLoading } = useFirebase();

  const tasksQuery = useMemo(() => {
    if (!firestore || !currentProject) return null;
    return collection(firestore, 'projects', currentProject.id, 'tasks');
  }, [firestore, currentProject]);

  const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(firestore ? collection(firestore, 'users') : null);
  
  const handleEVMWalletSignIn = () => {
    if (auth && firestore) {
      signInWithEVMWallet(auth, firestore);
    }
  };
  
  const loading = userLoading || tasksLoading || usersLoading || firebaseLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
       <>
        {/* A simplified header for the sign-in page */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-transparent px-4 backdrop-blur-lg sm:h-16 sm:px-6 glassmorphism"></header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
            <h2 className="text-2xl font-bold">Welcome to TasKing</h2>
            <p className="text-muted-foreground">Please sign in with your wallet to manage your projects.</p>
            <div className="flex items-center gap-4 mt-4">
               <Button onClick={handleEVMWalletSignIn}>
                 <Wallet className="mr-2 h-4 w-4" />
                 Sign In with Wallet
               </Button>
            </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex-1 flex overflow-x-auto p-4 sm:p-6">
        {loading ? (
           <div className="flex-1 flex items-center justify-center">
              <p>Loading tasks...</p>
            </div>
        ) : currentProject && tasks ? (
          <KanbanBoard tasks={tasks} statuses={statuses} users={users || []} currentProject={currentProject} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p>No projects found. Create a new project to get started.</p>
          </div>
        )}
      </div>
    </>
  );
}
