export function ModelCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-white/5 rounded-lg w-3/4" />
        <div className="h-3 bg-white/5 rounded-lg w-full" />
        <div className="flex gap-1">
          <div className="h-5 w-14 bg-white/5 rounded-full" />
          <div className="h-5 w-10 bg-white/5 rounded-full" />
        </div>
        <div className="flex justify-between pt-1 border-t border-white/5">
          <div className="h-3 bg-white/5 rounded w-12" />
          <div className="h-3 bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
