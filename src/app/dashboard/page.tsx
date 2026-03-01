"use client";

import { useAuth } from "@/application/useAuth";
import { useTemplates } from "@/application/useTemplates";
import { DataTable } from "@/components/features/TemplateTable/data-table";
import { getColumns } from "@/components/features/TemplateTable/columns";
import { Button } from "@/components/ui/button";
import { CopyPlus, Mailbox } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { templates, isLoading, createTemplate, isCreating } = useTemplates();
  const [newTemplateName, setNewTemplateName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      redirect("/");
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName) return;
    
    await createTemplate(newTemplateName);
    setNewTemplateName("");
    setOpen(false);
  };

  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage and edit your email templates.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0 text-white shadow-md">
                <CopyPlus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Give your new email template a memorable name.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Welcome Newsletter 2026" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    required 
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={isCreating} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                  {isCreating ? "Creating..." : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Mailbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
              <h3 className="text-2xl font-bold text-foreground">{templates.length}</h3>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Templates</h2>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-12 w-full bg-muted/50 animate-pulse rounded-md" />
              <div className="h-16 w-full bg-muted/30 animate-pulse rounded-md" />
              <div className="h-16 w-full bg-muted/30 animate-pulse rounded-md" />
            </div>
          ) : (
            <DataTable columns={getColumns()} data={templates} />
          )}
        </div>
      </div>
    </div>
  );
}
