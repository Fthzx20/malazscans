"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Users, Shield, ShieldAlert, UserCheck, UserX, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  commentsCount: number;
  bookmarksCount: number;
  readingHistoryCount: number;
}

interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  roleStats: Record<string, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLES = ['', 'user', 'moderator', 'editor', 'translator', 'admin'];
const STATUSES = ['', 'active', 'suspended', 'banned'];
const ROLE_COLORS: Record<string, string> = {
  admin: 'text-[#FF3D00] border-[#FF3D00]/30',
  moderator: 'text-purple-400 border-purple-400/30',
  editor: 'text-blue-400 border-blue-400/30',
  translator: 'text-cyan-400 border-cyan-400/30',
  user: 'text-[#737373] border-[#262626]',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500 bg-green-500/10',
  suspended: 'text-yellow-500 bg-yellow-500/10',
  banned: 'text-red-500 bg-red-500/10',
};

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; type: 'role' | 'status'; value: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(1), 300);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setConfirmAction({ userId, type: 'role', value: newRole });
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setConfirmAction({ userId, type: 'status', value: newStatus });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { userId, type, value } = confirmAction;

    try {
      const res = await fetch(`/api/admin/users/${userId}/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: value }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [type]: value } : u))
        );
      }
    } catch {
      // Error handling
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6 text-xs font-mono text-white">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <SummaryCard label="Total Users" value={summary.totalUsers} icon={<Users className="w-4 h-4 text-[#FF3D00]" />} />
          <SummaryCard label="Active" value={summary.activeUsers} icon={<UserCheck className="w-4 h-4 text-green-500" />} />
          <SummaryCard label="Suspended" value={summary.suspendedUsers} icon={<ShieldAlert className="w-4 h-4 text-yellow-500" />} />
          <SummaryCard label="Banned" value={summary.bannedUsers} icon={<UserX className="w-4 h-4 text-red-500" />} />
          <SummaryCard label="Admins" value={summary.roleStats?.admin || 0} icon={<Shield className="w-4 h-4 text-[#FF3D00]" />} />
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 border border-[#262626] bg-[#0F0F0F] p-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#737373]" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none placeholder:text-[#555]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); }}
          className="bg-[#151515] border border-[#262626] text-white text-xs px-3 py-2 font-mono focus:outline-none focus:border-[#FF3D00] cursor-pointer"
        >
          <option value="">All Roles</option>
          {ROLES.filter(Boolean).map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); }}
          className="bg-[#151515] border border-[#262626] text-white text-xs px-3 py-2 font-mono focus:outline-none focus:border-[#FF3D00] cursor-pointer"
        >
          <option value="">All Status</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-[#262626] bg-[#0F0F0F] overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-[#737373] animate-pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#737373]">No users found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-[#262626] text-[9px] text-[#737373] uppercase font-bold">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden lg:table-cell">Registered</th>
                <th className="px-4 py-3 hidden lg:table-cell">Comments</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#111] transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-left p-0"
                    >
                      <div className="w-7 h-7 border border-[#262626] bg-[#151515] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-3 h-3 text-[#737373]" />
                        )}
                      </div>
                      <span className="text-white font-bold truncate max-w-[120px]">{user.username}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#737373] hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`bg-transparent border px-2 py-1 text-[10px] font-bold uppercase cursor-pointer focus:outline-none ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}
                    >
                      {ROLES.filter(Boolean).map((r) => (
                        <option key={r} value={r} className="bg-[#0A0A0A] text-white">{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[user.status] || ''}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#737373] hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-[#737373] hidden lg:table-cell">
                    {user.commentsCount}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                        className="text-[10px] font-bold text-yellow-500 hover:text-yellow-300 bg-transparent border-none cursor-pointer uppercase"
                      >
                        Suspend
                      </button>
                    ) : user.status === 'suspended' ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'active')}
                        className="text-[10px] font-bold text-green-500 hover:text-green-300 bg-transparent border-none cursor-pointer uppercase"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, 'active')}
                        className="text-[10px] font-bold text-green-500 hover:text-green-300 bg-transparent border-none cursor-pointer uppercase"
                      >
                        Unban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border border-[#262626] bg-[#0F0F0F] px-4 py-3">
          <span className="text-[#737373]">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 border border-[#262626] bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-white hover:border-[#FF3D00]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 border border-[#262626] bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-white hover:border-[#FF3D00]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md bg-[#0F0F0F] border border-[#262626] p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-black uppercase text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-[#737373] hover:text-white bg-transparent border-none cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border border-[#262626] bg-[#151515] overflow-hidden flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-[#737373]" />
                  )}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedUser.username}</p>
                  <p className="text-[#737373]">{selectedUser.email}</p>
                </div>
              </div>
              <DetailRow label="Role" value={selectedUser.role} />
              <DetailRow label="Status" value={selectedUser.status} />
              <DetailRow label="Registered" value={new Date(selectedUser.createdAt).toLocaleString()} />
              <DetailRow label="Last Login" value={selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'} />
              <DetailRow label="Comments" value={String(selectedUser.commentsCount)} />
              <DetailRow label="Bookmarks" value={String(selectedUser.bookmarksCount)} />
              <DetailRow label="Reading Sessions" value={String(selectedUser.readingHistoryCount)} />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-[#0F0F0F] border border-[#262626] p-6 space-y-4 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-black uppercase text-white">Confirm Action</h3>
            <p className="text-[#A3A3A3]">
              Change <span className="text-white font-bold">{confirmAction.type}</span> to{' '}
              <span className="text-[#FF3D00] font-bold">{confirmAction.value}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-[#262626] text-[#737373] hover:text-white bg-transparent cursor-pointer text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-[#FF3D00] text-[#0A0A0A] font-bold text-xs uppercase cursor-pointer border-none hover:bg-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="border border-[#262626] bg-[#0F0F0F] p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[#737373] uppercase font-bold">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[#1a1a1a] pb-2">
      <span className="text-[#737373]">{label}</span>
      <span className="text-white font-bold capitalize">{value}</span>
    </div>
  );
}

export default UsersTab;
