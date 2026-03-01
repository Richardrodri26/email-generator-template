"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { useTestEmailStore } from "@/application/useTestEmailStore";

interface TestEmailDialogProps {
  getHtml: () => Promise<string>;
}

export function TestEmailDialog({ getHtml }: TestEmailDialogProps) {
  const { resendApiKey, setResendApiKey } = useTestEmailStore();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [open, setOpen] = useState(false);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const html = await getHtml();
      const res = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: resendApiKey,
          to,
          subject: "Test Email — MailGen",
          html,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setResult({ ok: false, message: json.error });
      } else {
        setResult({ ok: true, message: "Email sent successfully!" });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setResult({ ok: false, message });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" /> Send Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Email via Resend</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Resend API Key</Label>
            <Input
              type="password"
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              placeholder="re_xxxxxxxxxx"
            />
            <p className="text-[10px] text-muted-foreground">
              Stored in your browser only. Sent per-request to generate the email.
              Get your key at resend.com/api-keys
            </p>
          </div>
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? "text-green-600" : "text-red-500"}`}>
              {result.message}
            </p>
          )}
          <Button
            onClick={handleSend}
            disabled={sending || !resendApiKey || !to}
            className="w-full"
          >
            {sending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
