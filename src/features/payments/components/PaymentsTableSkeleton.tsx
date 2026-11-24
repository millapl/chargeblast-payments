const ROWS = 12;

export function PaymentsTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading payments" role="status">
      <div className="h-[35px] border-t border-b border-t-border border-b-line" />
      {Array.from({ length: ROWS }, (_, index) => (
        <div
          key={index}
          className="flex h-[35px] items-center gap-6 border-b border-line pl-[7px]"
        >
          <span className="size-4 rounded-sm bg-line" />
          <span className="h-3 w-24 rounded-sm bg-line" />
          <span className="h-3 w-16 rounded-sm bg-line" />
          <span className="h-3 w-28 rounded-sm bg-line" />
          <span className="h-3 w-40 rounded-sm bg-line" />
        </div>
      ))}
      <div className="h-[44px]" />
    </div>
  );
}
