"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Paintbrush } from "lucide-react";
import { LocalStorageThemeRepository } from "@/infrastructure/repositories/LocalStorageThemeRepository";
import { useAuth } from "@/application/useAuth";
import { v4 as uuidv4 } from "uuid";

const themeRepo = new LocalStorageThemeRepository();

interface ThemeInjectorProps {
  onThemeChange?: (css: string) => void;
}

export function ThemeInjector({ onThemeChange }: ThemeInjectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [cssVariables, setCssVariables] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    themeRepo.getDefaultTheme().then(theme => {
      if (theme && theme.authorId === user.id) {
        setCssVariables(theme.cssVariables);
        if (onThemeChange) onThemeChange(theme.cssVariables);
      }
    });
  }, [user, onThemeChange]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    let defaultTheme = await themeRepo.getDefaultTheme();
    
    if (defaultTheme && defaultTheme.authorId === user.id) {
      defaultTheme.cssVariables = cssVariables;
      defaultTheme.updatedAt = new Date().toISOString();
      await themeRepo.saveTheme(defaultTheme);
    } else {
      await themeRepo.saveTheme({
        id: uuidv4(),
        name: "My Custom Theme",
        authorId: user.id,
        isDefault: true,
        cssVariables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    if (onThemeChange) onThemeChange(cssVariables);
    setIsSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
          <Paintbrush className="h-4 w-4" />
          Theme Variables
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inject Shadcn Theme</DialogTitle>
          <DialogDescription>
            Paste your Shadcn global CSS variables (the `:root` or `.dark` block) here. This will be injected into your generated HTML template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>CSS Variables</Label>
            <textarea 
              className="w-full h-48 p-3 text-sm font-mono border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-muted/50"
              placeholder=":root {&#10;  --background: 222.2 84% 4.9%;&#10;  --foreground: 210 40% 98%;&#10;  --primary: 210 40% 98%;&#10;}"
              value={cssVariables}
              onChange={(e) => setCssVariables(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full"
          >
            {isSaving ? "Saving..." : "Apply Theme"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
