// The reference screenshot shows a thin outlined tray-and-arrow icon, while the live Dashboard now
// ships a heavier 12px variant. This is traced from the reference at 1 CSS px stroke, not an
// official asset.
export function ExportIcon() {
  return (
    <svg
      aria-hidden
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M.9 7.8v2.7h9.9V7.8" />
      <path d="M4.3 8.2V5.1c0-1 .7-1.7 1.7-1.7h4.6" />
      <path d="M8.3.9 11 3.4 8.3 6" />
    </svg>
  );
}
