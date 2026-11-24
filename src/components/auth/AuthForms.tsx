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
import { useLocale } from "@/components/i18n/LocaleProvider";

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
  const { t } = useLocale();
  const [state, action] = useActionState<FormState, FormData>(signInAction, null);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {linkError && !state && (
        <FormMessage error={t("auth.linkError")} />
      )}
      <FormMessage error={state?.error} />
      <Field name="email" type="email" text={t("auth.email")} autoComplete="email" />
      <Field name="password" type="password" text={t("auth.password")} autoComplete="current-password" />
      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-cognac hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </div>
      <SubmitButton className={`${button.primary} w-full`} pendingText={t("auth.loggingIn")}>
        {t("auth.login")}
      </SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { t } = useLocale();
  const [state, action] = useActionState<FormState, FormData>(signUpAction, null);
  if (state?.success) return <FormMessage success={state.success} />;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <FormMessage error={state?.error} />
      <Field name="fullName" text={t("auth.fullName")} autoComplete="name" />
      <Field name="email" type="email" text={t("auth.email")} autoComplete="email" />
      <Field name="password" type="password" text={t("auth.passwordMin")} autoComplete="new-password" minLength={8} />
      <SubmitButton className={`${button.primary} w-full`} pendingText={t("auth.creating")}>
        {t("auth.create")}
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { t } = useLocale();
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} success={state?.success} />
      <Field name="email" type="email" text={t("auth.email")} autoComplete="email" />
      <SubmitButton className={`${button.primary} w-full`} pendingText={t("auth.sending")}>
        {t("auth.sendLink")}
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const { t } = useLocale();
  const [state, action] = useActionState<FormState, FormData>(updatePasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <Field name="password" type="password" text={t("auth.newPassword")} autoComplete="new-password" minLength={8} />
      <Field name="confirm" type="password" text={t("auth.confirmPassword")} autoComplete="new-password" minLength={8} />
      <SubmitButton className={`${button.primary} w-full`} pendingText={t("auth.saving")}>
        {t("auth.savePassword")}
      </SubmitButton>
    </form>
  );
}
