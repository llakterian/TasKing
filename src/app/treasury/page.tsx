'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Landmark } from "lucide-react";

export default function TreasuryPage() {
  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Treasury</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Landmark className="w-8 h-8 text-muted-foreground" />
            <div>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                This page will display the DAO treasury information.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You will be able to view treasury balances, transaction history, and manage funds from this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
