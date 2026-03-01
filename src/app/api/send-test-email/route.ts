import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const bodySchema = z.object({
  apiKey: z.string().min(1),
  to: z.string().email(),
  subject: z.string().optional(),
  html: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { apiKey, to, subject, html } = parsed.data;
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: "MailGen Preview <onboarding@resend.dev>",
      to: [to],
      subject: subject || "Email Preview — MailGen",
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    console.error("[send-test-email]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
