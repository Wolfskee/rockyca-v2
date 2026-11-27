"use client";

import { Alert, Button } from "@heroui/react";
import { FormEvent, useCallback, useRef, useState } from "react";
import { ApiError, submitContactForm } from "@/lib/api";
import { TurnstileWidget } from "./TurnstileWidget";

const SUBJECTS = [
  "Vehicle Inquiry",
  "Schedule Viewing",
  "General Question",
] as const;

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<string>(
    defaultSubject && SUBJECTS.includes(defaultSubject as (typeof SUBJECTS)[number])
      ? defaultSubject
      : "",
  );
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot field
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const formLoadedAtRef = useRef<number>(Date.now());

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      !turnstileToken
    ) {
      setErrorMsg("Please complete the human verification check first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitContactForm({
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
        turnstileToken: turnstileToken || undefined,
        website: website || undefined,
        formLoadedAt: formLoadedAtRef.current,
      });

      setSuccessMsg(
        res.message ||
          "Your message has been sent. Thank you for contacting us!",
      );
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setWebsite("");
      formLoadedAtRef.current = Date.now();
      setTurnstileReset((n) => n + 1);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : "Unable to send your message right now. Please call +1 (204)-256-5277.",
      );
      setTurnstileReset((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
      <div aria-live="polite" role="status">
        {successMsg && (
          <Alert status="success" className="mb-4">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Message Sent</Alert.Title>
              <Alert.Description>{successMsg}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
        {errorMsg && (
          <Alert status="danger" className="mb-4">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Unable to Submit</Alert.Title>
              <Alert.Description>{errorMsg}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>

      {/* Honeypot input — hidden from real users and assistive technology */}
      <div className="sr-only-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="contact-name"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Name <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Email <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="contact-phone"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Phone
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          maxLength={50}
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Subject <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <select
          id="contact-subject"
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Select a subject</option>
          {SUBJECTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Message <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby="contact-message-help"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <p id="contact-message-help" className="mt-1 text-xs text-slate-500">
          Minimum 10 characters. Please include the Stock # if inquiring about a
          specific vehicle or ramp.
        </p>
      </div>

      <TurnstileWidget onToken={handleToken} resetSignal={turnstileReset} />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isDisabled={submitting}
        className="h-12 bg-blue-600 text-base font-semibold text-white hover:bg-blue-700"
      >
        {submitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
