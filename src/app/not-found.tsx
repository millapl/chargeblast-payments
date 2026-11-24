import Link from "next/link";
import { buttonStyles } from "@/shared/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-title font-bold text-ink-strong">Page not found</h1>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link href="/payments" className={buttonStyles("primary")}>
        Back to Transactions
      </Link>
    </main>
  );
}
