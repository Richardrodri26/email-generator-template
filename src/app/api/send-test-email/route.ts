import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const { apiKey, to, subject, html } = await request.json();

  if (!apiKey || !to || !html) {
    return NextResponse.json(
      { error: "Missing apiKey, to, or html" },
      { status: 400 }
    );
  }

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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
