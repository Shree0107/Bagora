"use client";

import { useFormStatus } from "react-dom";
import { button } from "./styles";

/** A submit button that shows a pending label while its <form> action runs. */
export function SubmitButton({
  children,
  pendingText = "Please wait…",
  className = button.primary,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
