"use client";

import { useState, type FormEvent } from "react";
import { submitContactAction } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3.5 py-2 text-base outline-none transition-[color,background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function ContactForm() {
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    try {
      const result = await submitContactAction({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        orderNumber: String(data.get("orderNumber") || ""),
        subject: String(data.get("subject") || ""),
        message: String(data.get("message") || ""),
      });
      form.reset();
      toast({
        title: "Message sent",
        description: result.inbox
          ? `We sent your note to ${result.inbox}.`
          : "We sent your note to the store.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send your message.";
      toast({ title: "Message not sent", description: message, variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone number (optional)</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-order">Order number (if applicable)</Label>
          <Input id="contact-order" name="orderNumber" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className={cn(fieldClass, "h-auto min-h-36 py-3")}
        />
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={sending}>
        {sending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
