'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarRail,
} from "@/components/ui";
import { Header } from "@/components/header";
import { SidebarNav } from "@/components/sidebar-nav";
import type { Project } from "@/lib/data";

export function AppLayout({
  children,
  currentProject,
  onProjectChange,
}: {
  children: React.ReactNode;
  currentProject?: Project;
  onProjectChange?: (project: Project) => void;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarRail />
      <SidebarInset>
        <div className="flex flex-col min-h-svh">
          <Header onProjectChange={onProjectChange} currentProject={currentProject} />
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
