import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export function TextInput({
  label,
  error,
  id,
  className,
  ...props
}: TextInputProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold text-ink-strong"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-[30px] w-full rounded-md bg-white px-2 text-body text-ink ring-1 ring-control outline-none placeholder:text-disabled",
          "focus-visible:ring-2 focus-visible:ring-accent-text",
          error && "ring-danger-text",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
