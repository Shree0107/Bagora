"use client";

import { useActionState } from "react";
import { sendContactMessageAction, type FormState } from "@/lib/site-actions";
import { button, input, label } from "@/components/ui/styles";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessageAction, {});
  const err = state.fieldErrors ?? {};

  if (state.ok) {
    return <p role="status" className="text-[15px] leading-relaxed text-forest">{state.message}</p>;
  }

  const field = (name: string, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`c-${name}`} className={label}>{text}</label>
      <input
        id={`c-${name}`}
        name={name}
        aria-invalid={Boolean(err[name])}
        aria-describedby={err[name] ? `c-${name}-err` : undefined}
        className={`${input} ${err[name] ? "border-danger" : ""}`}
        {...props}
      />
      {err[name] && <p id={`c-${name}-err`} className="mt-1.5 text-sm text-danger">{err[name]}</p>}
    </div>
  );

  return (
    <form action={action} noValidate className="space-y-5">
      {field("name", "Your name", { autoComplete: "name", required: true })}
      {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
      {field("phone", "Mobile (optional)", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
      {field("orderRef", "Order number (optional)", { placeholder: "#3F2A9C1B" })}
      <div>
        <label htmlFor="c-message" className={label}>Message</label>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          required
          aria-invalid={Boolean(err.message)}
          aria-describedby={err.message ? "c-message-err" : undefined}
          className={`${input} min-h-32 ${err.message ? "border-danger" : ""}`}
        />
        {err.message && <p id="c-message-err" className="mt-1.5 text-sm text-danger">{err.message}</p>}
      </div>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${button.primary} w-full`}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
