'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Globe } from "lucide-react";

export default function SitesPage() {
  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Project Sites</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Globe className="w-8 h-8 text-muted-foreground" />
            <div>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                This page will allow you to manage your project websites.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for creating and managing project-specific websites and landing pages will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
