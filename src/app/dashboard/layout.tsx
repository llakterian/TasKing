'use client';
import * as React from 'react';
import { AppLayout } from "@/components/app-layout";
import { useUser, useFirebase, useCollection, useCurrentProject } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Project } from "@/lib/data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { currentProject, setCurrentProject } = useCurrentProject();

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
    <AppLayout>
      {children}
    </AppLayout>
  );
}
