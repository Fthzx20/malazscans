import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { Notification } from '../../../types';

export const AnnouncementsTab: React.FC = () => {
  const triggerToast = useNovelStore((state) => state.triggerToast);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [autoClose, setAutoClose] = useState(true);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(10);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [createdAt, setCreatedAt] = useState('');

  useEffect(() => {
    fetch('/api/admin/announcements')
      .then(res => res.ok ? res.json() : [])
      .then((data: Notification[]) => setNotifications(data))
      .catch(() => {});
  }, []);

  const refreshAnnouncements = async () => {
    const res = await fetch('/api/admin/announcements');
    if (res.ok) setNotifications(await res.json());
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setStatus('published');
    setPriority('medium');
    setAutoClose(true);
    setAutoCloseSeconds(10);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setCreatedAt('');
  };

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      triggerToast("Title and Content are required.");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/announcements/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, status, priority, startDate, endDate, autoClose, autoCloseSeconds: Number(autoCloseSeconds) }),
        });
        if (!res.ok) { triggerToast("Failed to update."); return; }
        triggerToast("Notification updated successfully.");
      } else {
        const res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, status, priority, startDate, endDate, autoClose, autoCloseSeconds: Number(autoCloseSeconds) }),
        });
        if (!res.ok) { triggerToast("Failed to create."); return; }
        triggerToast("Notification created successfully.");
      }
      await refreshAnnouncements();
      resetForm();
    } catch {
      triggerToast("Operation failed. Check connection.");
    }
  };

  const handleEditClick = (n: Notification) => {
    setEditingId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setStatus(n.status);
    setPriority(n.priority);
    setAutoClose(n.autoClose);
    setAutoCloseSeconds(n.autoCloseSeconds);
    setStartDate(n.startDate);
    setEndDate(n.endDate);
    setCreatedAt(n.createdAt);
  };

  const handleDeleteNotification = async (id: string) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      try {
        await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
        await refreshAnnouncements();
        triggerToast("Notification deleted.");
        if (editingId === id) resetForm();
      } catch {
        triggerToast("Failed to delete.");
      }
    }
  };

  const toggleStatus = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    const nextStatus = target.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshAnnouncements();
      triggerToast(`Notification ${nextStatus === 'published' ? 'published' : 'saved as draft'}.`);
    } catch {
      triggerToast("Failed to toggle status.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs font-mono text-white">
      {/* Left Form: Create/Edit Notification */}
      <div className="lg:col-span-5 border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-white">
          <Bell className="w-5 h-5 text-[#FF3D00]" />
          <h3 className="text-base font-black uppercase tracking-tight">
            {editingId ? 'Edit Notification' : 'Create Notification'}
          </h3>
        </div>

        <form onSubmit={handleSaveNotification} className="space-y-4 font-mono text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
              placeholder="Important Notice..."
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#737373] uppercase font-bold block">Notice Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
              placeholder="Notification details..."
              rows={4}
              required
            ></textarea>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none uppercase font-bold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00] rounded-none uppercase font-bold"
              >
                <option value="published">Published</option>
                <option value="draft">Draft (Unpublished)</option>
              </select>
            </div>
          </div>

          {/* Auto Close checkbox and seconds */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_close_toggle"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="w-4 h-4 accent-[#FF3D00] cursor-pointer"
              />
              <label htmlFor="auto_close_toggle" className="ml-2 text-white font-bold cursor-pointer select-none">Auto Close</label>
            </div>
            {autoClose && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#737373] uppercase font-bold block">Auto Close (Seconds)</label>
                <input
                  type="number"
                  value={autoCloseSeconds}
                  onChange={(e) => setAutoCloseSeconds(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#151515] border border-[#262626] p-2.5 text-white focus:outline-none focus:border-[#FF3D00] rounded-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#FF3D00] text-[#0A0A0A] font-black py-3 uppercase hover:bg-white transition-colors cursor-pointer border-none"
            >
              {editingId ? 'Save Updates' : 'Create Notification'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 border border-[#262626] hover:border-white text-white font-bold py-3 uppercase bg-transparent cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right List: Table of notifications */}
      <div className="lg:col-span-7 border border-[#262626] bg-[#0F0F0F] p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-tight border-b border-[#262626] pb-3">
          Notification Catalogue
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px] text-left text-xs font-mono text-[#FAFAFA]">
            <thead>
              <tr className="border-b border-[#262626] text-[#737373] uppercase">
                <th className="pb-3">Title</th>
                <th className="pb-3 text-center">Priority</th>
                <th className="pb-3 text-center">Auto Close</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/40">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3.5 font-bold text-white max-w-[150px] truncate">
                      <div>{n.title}</div>
                      <div className="text-[9px] text-[#737373] font-normal font-mono">
                        {n.startDate} to {n.endDate}
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                          n.priority === 'high'
                            ? 'border-[#FF3D00]/50 text-[#FF3D00] bg-[#FF3D00]/10'
                            : n.priority === 'medium'
                            ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                            : 'border-[#737373]/50 text-[#737373] bg-[#737373]/10'
                        }`}
                      >
                        {n.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 text-center text-[10px] text-[#A3A3A3]">
                      {n.autoClose ? `${n.autoCloseSeconds}s` : 'Off'}
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => toggleStatus(n.id)}
                        className="bg-transparent border-none cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                      >
                        {n.status === 'published' ? (
                          <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Published
                          </span>
                        ) : (
                          <span className="text-[#737373] flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Draft
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(n)}
                        className="text-[#A3A3A3] hover:text-[#FF3D00] p-1 bg-transparent border-none cursor-pointer"
                        title="Edit Notification"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="text-red-500 hover:text-red-400 p-1 bg-transparent border-none cursor-pointer"
                        title="Delete Notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#737373]">
                    No notifications registered. Use the form on the left to publish a new notice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsTab;
