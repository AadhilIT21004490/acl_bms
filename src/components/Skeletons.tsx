export function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/60">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-3.5 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-1/2 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell">
        <div className="skeleton h-3 w-20 rounded" />
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-14 rounded-full" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="skeleton h-6 w-20 rounded-full" />
      </td>
      <td className="px-4 py-4">
        <div className="flex gap-2">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3 animate-pulse">
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-8 w-1/2 rounded" />
    </div>
  );
}
