type Status = 'Draft' | 'Published' | 'Trash';

const config: Record<Status, { label: string; className: string }> = {
  Published: {
    label: 'Published',
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  Draft: {
    label: 'Draft',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  Trash: {
    label: 'Trash',
    className: 'bg-red-500/15 text-red-400 border border-red-500/30',
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status] ?? config.Draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {label}
    </span>
  );
}
