"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type FormState,
} from "@/lib/auth-actions";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";

function Field({
  name,
  type = "text",
  text,
  autoComplete,
  minLength,
}: {
  name: string;
  type?: string;
  text: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {text}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        className={input}
      />
    </div>
  );
}

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(signInAction, null);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {linkError && !state && (
        <FormMessage error="That link is invalid or has expired. Please log in or request a new link." />
      )}
      <FormMessage error={state?.error} />
      <Field name="email" type="email" text="Email" autoComplete="email" />
      <Field name="password" type="password" text="Password" autoComplete="current-password" />
      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-cognac hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton className={`${button.primary} w-full`} pendingText="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, null);
  if (state?.success) return <FormMessage success={state.success} />;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormMessage error={state?.error} />
      <Field name="fullName" text="Full name" autoComplete="name" />
      <Field name="email" type="email" text="Email" autoComplete="email" />
      <Field name="password" type="password" text="Password (min. 8 characters)" autoComplete="new-password" minLength={8} />
      <SubmitButton className={`${button.primary} w-full`} pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} success={state?.success} />
      <Field name="email" type="email" text="Email" autoComplete="email" />
      <SubmitButton className={`${button.primary} w-full`} pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <Field name="password" type="password" text="New password" autoComplete="new-password" minLength={8} />
      <Field name="confirm" type="password" text="Confirm new password" autoComplete="new-password" minLength={8} />
      <SubmitButton className={`${button.primary} w-full`} pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
