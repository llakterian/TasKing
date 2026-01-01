'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Shield } from "lucide-react";

export default function GovernancePage() {
  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">DAO Governance</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-muted-foreground" />
            <div>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                This page will be for DAO governance and voting.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for creating proposals, voting on them, and viewing governance history will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
