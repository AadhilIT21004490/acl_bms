'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PenSquare, Trash2, Eye, Search, Filter, RefreshCw,
  FileText, Globe, Archive, Layers, ChevronLeft, ChevronRight,
  RotateCcw, X, Newspaper,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { SkeletonRow, SkeletonCard } from '@/components/Skeletons';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Author { _id: string; name: string; email: string; image?: string }
interface Post {
  _id: string;
  title: string;
  description: string;
  mainImage?: string;
  status: 'Draft' | 'Published' | 'Trash';
  tags: string[];
  date: string;
  dayOfWeek: string;
  authorId: Author;
  createdAt: string;
}
interface Pagination { total: number; page: number; limit: number; totalPages: number }

type StatusFilter = '' | 'Draft' | 'Published' | 'Trash';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, loading,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; loading: boolean;
}) {
  if (loading) return <div className="skeleton h-24 rounded-2xl" />;
  return (
    <div className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
      <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  title, message, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card p-6 w-full max-w-sm space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-400">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors
              ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [posts,      setPosts]      = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats,      setStats]      = useState({ total: 0, published: 0, draft: 0, trash: 0 });
  const [loading,    setLoading]    = useState(true);

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [page,         setPage]         = useState(1);

  // Confirm modal state
  const [confirm, setConfirm] = useState<{
    open: boolean; postId: string; postTitle: string; action: 'trash' | 'restore' | 'delete';
  }>({ open: false, postId: '', postTitle: '', action: 'trash' });

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: '10',
        ...(search       && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // ── Fetch stats (totals per status) ───────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const [all, pub, draft, trash] = await Promise.all([
        fetch('/api/posts?limit=1').then(r => r.json()),
        fetch('/api/posts?limit=1&status=Published').then(r => r.json()),
        fetch('/api/posts?limit=1&status=Draft').then(r => r.json()),
        fetch('/api/posts?limit=1&status=Trash').then(r => r.json()),
      ]);
      setStats({
        total:     all.pagination?.total ?? 0,
        published: pub.pagination?.total ?? 0,
        draft:     draft.pagination?.total ?? 0,
        trash:     trash.pagination?.total ?? 0,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPosts(); fetchStats(); }, [fetchPosts, fetchStats]);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchPosts(); }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAction = async () => {
    const { postId, action } = confirm;
    setConfirm(prev => ({ ...prev, open: false }));

    startTransition(async () => {
      if (action === 'trash') {
        await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      } else if (action === 'restore') {
        await fetch(`/api/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Draft' }),
        });
      } else if (action === 'delete') {
        await fetch(`/api/posts/${postId}?hard=true`, { method: 'DELETE' });
      }
      await fetchPosts({ silent: true });
      await fetchStats();
    });
  };

  const openConfirm = (postId: string, postTitle: string, action: typeof confirm.action) => {
    setConfirm({ open: true, postId, postTitle, action });
  };

  const filterButtons: { label: string; value: StatusFilter; count: number }[] = [
    { label: 'All',       value: '',          count: stats.total },
    { label: 'Published', value: 'Published', count: stats.published },
    { label: 'Draft',     value: 'Draft',     count: stats.draft },
    { label: 'Trash',     value: 'Trash',     count: stats.trash },
  ];

  const modalConfig = {
    trash: {
      title: 'Move to Trash',
      message: `"${confirm.postTitle}" will be moved to Trash. You can restore it later.`,
      confirmLabel: 'Move to Trash',
      danger: true,
    },
    restore: {
      title: 'Restore Post',
      message: `"${confirm.postTitle}" will be restored as a Draft.`,
      confirmLabel: 'Restore',
      danger: false,
    },
    delete: {
      title: 'Permanently Delete',
      message: `"${confirm.postTitle}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete Forever',
      danger: true,
    },
  }[confirm.action];

  return (
    <>
      {/* ── Confirm Modal ─────────────────────────────────────────── */}
      {confirm.open && (
        <ConfirmModal
          {...modalConfig}
          onConfirm={handleAction}
          onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
        />
      )}

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all your news posts in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchPosts({ silent: true }); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-sm font-medium transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <PenSquare className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Posts"  value={stats.total}     icon={Layers}    color="bg-indigo-600/20 text-indigo-400"  loading={loading} />
        <StatCard label="Published"    value={stats.published} icon={Globe}     color="bg-emerald-600/20 text-emerald-400" loading={loading} />
        <StatCard label="Drafts"       value={stats.draft}     icon={FileText}  color="bg-amber-600/20 text-amber-400"    loading={loading} />
        <StatCard label="In Trash"     value={stats.trash}     icon={Archive}   color="bg-red-600/20 text-red-400"        loading={loading} />
      </div>

      {/* ── Filters & Search ───────────────────────────────────────── */}
      <div className="glass-card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {filterButtons.map(({ label, value, count }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${statusFilter === value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs leading-none
                ${statusFilter === value ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            id="dashboard-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts by title…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Post</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                        <Newspaper className="w-6 h-6 text-slate-600" />
                      </div>
                      <p className="text-slate-500 text-sm">No posts found</p>
                      {(search || statusFilter) && (
                        <button
                          onClick={() => { setSearch(''); setStatusFilter(''); }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" /> Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map(post => (
                  <tr
                    key={post._id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 group"
                  >
                    {/* Post Title + Image */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                          {post.mainImage ? (
                            <img
                              src={post.mainImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="w-4 h-4 text-slate-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-200 truncate max-w-[220px] group-hover:text-white transition-colors">
                            {post.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">
                            {post.dayOfWeek}, {post.date}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-slate-400 text-xs">{post.date}</span>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-xs border border-slate-700">
                            +{post.tags.length - 3}
                          </span>
                        )}
                        {post.tags.length === 0 && (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={post.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {post.status !== 'Trash' ? (
                          <>
                            <Link
                              href={`/admin/posts/${post._id}/edit`}
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                              title="Edit"
                            >
                              <PenSquare className="w-4 h-4" />
                            </Link>
                            <a
                              href={`/blog/${post._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => openConfirm(post._id, post.title, 'trash')}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openConfirm(post._id, post.title, 'restore')}
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                              title="Restore"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConfirm(post._id, post.title, 'delete')}
                              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/40">
            <p className="text-xs text-slate-500">
              Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const pg = i + 1;
                if (pagination.totalPages > 7 && Math.abs(pg - page) > 2 && pg !== 1 && pg !== pagination.totalPages) {
                  if (pg === 2 || pg === pagination.totalPages - 1) return <span key={pg} className="text-slate-600 px-1">…</span>;
                  return null;
                }
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all
                      ${pg === page
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
