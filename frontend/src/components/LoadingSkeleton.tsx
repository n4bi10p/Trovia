export default function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass p-6">
          <div className="skeleton mb-4 h-5 w-20" />
          <div className="mb-3 flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-5 w-40" />
          </div>
          <div className="skeleton mb-2 h-4 w-full" />
          <div className="skeleton mb-4 h-4 w-3/4" />
          <div className="skeleton h-4 w-28" />
        </div>
      ))}
    </div>
  );
}
