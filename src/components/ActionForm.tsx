"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import type { ActionState } from "@/actions/cart";

function Submit({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={clsx("inline-flex items-center justify-center gap-2 rounded-full bg-eden-green px-6 py-3 text-sm font-semibold text-eden-ivory transition hover:bg-eden-green-2 disabled:opacity-60", className)}>
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-eden-ivory/40 border-t-eden-ivory" />}
      {label}
    </button>
  );
}

export function ActionForm({
  action,
  submitLabel,
  children,
  className,
  submitClassName,
  resetOnSuccess,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  submitClassName?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className} noValidate={false}>
      {children}
      {state?.error && (
        <p role="alert" className="mt-4 rounded-xl bg-eden-red/5 px-4 py-3 text-sm text-eden-red">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p role="status" className="mt-4 rounded-xl bg-eden-green/5 px-4 py-3 text-sm text-eden-green">
          {state.message}
        </p>
      )}
      <div className="mt-5">
        <Submit label={submitLabel} className={submitClassName} />
      </div>
    </form>
  );
}
