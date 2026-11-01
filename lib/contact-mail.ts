import nodemailer from "nodemailer";

export type ContactMessage = {
  to: string;
  name: string;
  email: string;
  phone: string;
  orderNumber: string;
  subject: string;
  message: string;
};

function smtpConfig(inbox: string) {
  const user = process.env.SMTP_USER?.trim() || inbox;
  const pass = process.env.SMTP_PASS?.trim() || "";
  const host = process.env.SMTP_HOST?.trim() || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT || "465");
  return { user, pass, host, port };
}

export function isContactMailConfigured(inbox = "") {
  return Boolean(smtpConfig(inbox).pass);
}

export async function sendContactMessage(input: ContactMessage) {
  const to = input.to.trim();
  if (!to) {
    throw new Error(
      "Store contact email is not set. Add it under WooCommerce → Settings → Emails.",
    );
  }
  const { user, pass, host, port } = smtpConfig(to);
  if (!pass) {
    throw new Error(
      "Contact mail is not configured. Set SMTP_PASS in .env.local.",
    );
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const lines = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Phone: ${input.phone}` : "",
    input.orderNumber ? `Order number: ${input.orderNumber}` : "",
    "",
    input.message,
  ].filter((line) => line !== "");

  await transport.sendMail({
    from: `"Store" <${user}>`,
    to,
    replyTo: input.email,
    subject: input.subject,
    text: lines.join("\n"),
  });
}
