"use client";

import React from 'react';
import {
  ArrowLeft, LayoutDashboard, BookOpen, FileText, ListCollapse,
  BarChart2, ShieldAlert, Bell, Plus, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNovelStore } from '../../novels/store/novelStore';
import { useAdminStore } from '../store/adminStore';
import { SystemEditor } from './SystemEditor';
import { ManageNovelsTab } from './ManageNovelsTab';
import { ManageChaptersTab } from './ManageChaptersTab';
import { OverviewTab } from './OverviewTab';
import { RecommendationsTab } from './RecommendationsTab';
import { AnalyticsTab } from './AnalyticsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AnnouncementsTab } from './AnnouncementsTab';
import { Chapter } from '../../../types';

const NAV_GROUPS = [
  {
    label: 'Content',
    items: [
      { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { key: 'novels', label: 'Novels', icon: BookOpen },
      { key: 'chapters', label: 'Chapters', icon: FileText },
    ]
  },
  {
    label: 'Community',
    items: [
      { key: 'recommendations', label: 'Recommendations', icon: ListCollapse },
      { key: 'announcements', label: 'Notifications', icon: Bell },
    ]
  },
  {
    label: 'Platform',
    items: [
      { key: 'analytics', label: 'Analytics', icon: BarChart2 },
      { key: 'settings', label: 'Settings', icon: ShieldAlert },
    ]
  },
];

export const AdminDashboard: React.FC = () => {
  const novels = useNovelStore((state) => state.novels);
  const setNovels = useNovelStore((state) => state.setNovels);
  const setCurrentPage = useNovelStore((state) => state.setCurrentPage);
  const triggerToast = useNovelStore((state) => state.triggerToast);

  const {
    adminActiveSubTab,
    setAdminActiveSubTab,
    activeEditorMode,
    setActiveEditorMode,
    selectedAdminNovelId,
    editingChapterId,
    adminChapTitle,
    adminChapContent,
    resetChapterForm,
    setIsNovelDrawerOpen,
    resetNovelForm,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useAdminStore();

  const handleSaveChapter = () => {
    if (!adminChapTitle.trim() || !adminChapContent.trim()) {
      triggerToast('Please fill in the title and content of the chapter.');
      return;
    }

    const targetNovelIndex = novels.findIndex((n) => n.id === selectedAdminNovelId);
    if (targetNovelIndex === -1) {
      triggerToast('Target novel not found.');
      return;
    }

    const updated = [...novels];
    const targetNovel = updated[targetNovelIndex];
    const targetVolume = targetNovel.volumes[0];

    let contentToSave = adminChapContent;
    if (!adminChapContent.trim().startsWith('{')) {
      const { convertTextToTiptapJSON } = require('../utils/editor');
      contentToSave = JSON.stringify(convertTextToTiptapJSON(adminChapContent));
    }

    if (activeEditorMode === 'create') {
      const newChapterId = `${targetNovel.id}-v1-c${targetVolume.chapters.length + 1}`;
      const newChapter: Chapter = {
        id: newChapterId,
        title: `Chapter ${targetVolume.chapters.length + 1}: ${adminChapTitle}`,
        publishDate: new Date().toISOString(),
        content: contentToSave,
      };
      targetVolume.chapters.push(newChapter);
      triggerToast('Chapter published successfully.');
    } else if (activeEditorMode === 'edit' && editingChapterId) {
      targetVolume.chapters = targetVolume.chapters.map((c) => {
        if (c.id === editingChapterId) {
          const prefixMatch = c.title.match(/^Chapter \d+:/);
          const prefix = prefixMatch ? prefixMatch[0] : '';
          return {
            ...c,
            title: prefix ? `${prefix} ${adminChapTitle}` : adminChapTitle,
            content: contentToSave,
          };
        }
        return c;
      });
      triggerToast('Chapter updates saved successfully.');
    }

    setNovels(updated);
    resetChapterForm();
    setActiveEditorMode(null);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      const updated = novels.map((n) => {
        if (n.id === selectedAdminNovelId) {
          const vol = n.volumes[0];
          return {
            ...n,
            volumes: [{ ...vol, chapters: vol.chapters.filter((c) => c.id !== chapterId) }],
          };
        }
        return n;
      });
      setNovels(updated);
      triggerToast('Chapter deleted successfully.');
    }
  };

  const TAB_LABELS: Record<string, string> = {
    dashboard: 'Overview',
    novels: 'Novel Management',
    chapters: 'Chapter Management',
    recommendations: 'Recommendations',
    announcements: 'Notifications',
    analytics: 'Analytics',
    settings: 'System Settings',
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarCollapsed]);

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-64px)] text-xs font-mono text-white bg-[#0B0B0B]">
      {activeEditorMode ? (
        <div className="w-full px-4 sm:px-8 py-8">
          <SystemEditor handleSaveChapter={handleSaveChapter} />
        </div>
      ) : (
        <>
          {/* Mobile Sidebar Offcanvas Drawer Overlay */}
          {isMobileNavOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileNavOpen(false)}
              />
              <div className="relative flex flex-col w-64 max-w-xs bg-[#0F0F0F] border-r border-[#262626] h-full p-5 shadow-2xl animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4 mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-white">Menu Navigation</span>
                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="p-1.5 text-[#737373] hover:text-white bg-transparent border-none cursor-pointer rounded-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <nav className="flex-grow space-y-6 overflow-y-auto pr-1">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="text-[9px] font-mono font-black text-[#555] uppercase tracking-widest px-3">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = adminActiveSubTab === item.key;
                          return (
                            <button
                              key={item.key}
                              onClick={() => {
                                setAdminActiveSubTab(item.key as any);
                                setIsMobileNavOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-mono font-bold border-none cursor-pointer transition-all rounded-none ${
                                isActive
                                  ? 'text-[#FF3D00] bg-[#FF3D00]/8 border-l-2 border-l-[#FF3D00]'
                                  : 'text-[#737373] bg-transparent hover:text-white hover:bg-[#111]'
                              }`}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* ─── Dashboard Header ─── */}
          <div className="border-b border-[#262626] bg-[#0A0A0A] w-full">
            <div className="w-full px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile Hamburger toggle */}
                <button
                  onClick={() => setIsMobileNavOpen(true)}
                  className="md:hidden p-2 border border-[#262626] hover:border-[#737373] text-[#737373] hover:text-white bg-transparent cursor-pointer rounded-none"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-base sm:text-xl font-black uppercase tracking-tighter text-white font-sans">
                    Admin Dashboard
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-[#737373] font-mono mt-0.5 hidden xs:block">
                    Manage novels, chapters, recommendations, notifications, and platform settings.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    resetNovelForm();
                    setIsNovelDrawerOpen(true);
                    setAdminActiveSubTab('novels');
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#FF3D00] text-[#0A0A0A] text-xs font-mono font-black py-2.5 px-4 uppercase hover:bg-white transition-colors border-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">New Novel</span>
                </button>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="inline-flex items-center gap-1.5 border border-[#333] hover:border-[#737373] text-xs font-mono font-bold uppercase py-2.5 px-3 transition-colors text-[#737373] hover:text-white bg-transparent cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Body: Sidebar + Workspace ─── */}
          <div className="flex flex-1 w-full px-4 sm:px-8 py-0">

            {/* Sidebar (Desktop/Tablet) */}
            <aside className={`hidden md:flex flex-col flex-shrink-0 border-r border-[#1a1a1a] py-6 pr-4 gap-6 transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'w-16' : 'w-60'
            }`}>
              
              {/* Collapse/Expand Toggle Button in Sidebar */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center justify-center p-1.5 border border-[#262626] hover:border-[#FF3D00] hover:text-[#FF3D00] transition-colors rounded-none bg-transparent text-[#737373] cursor-pointer self-end w-8 h-8"
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <div className="flex-1 space-y-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-2">
                    {!isSidebarCollapsed ? (
                      <p className="text-[9px] font-mono font-black text-[#555] uppercase tracking-widest px-3">
                        {group.label}
                      </p>
                    ) : (
                      <div className="h-px bg-[#1a1a1a] mx-2" />
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = adminActiveSubTab === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setAdminActiveSubTab(item.key as any)}
                            className={`w-full flex items-center ${
                              isSidebarCollapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2'
                            } text-left text-xs font-mono font-bold border-none cursor-pointer transition-all rounded-none ${
                              isActive
                                ? 'text-[#FF3D00] bg-[#FF3D00]/8 border-l-2 border-l-[#FF3D00]'
                                : 'text-[#737373] bg-transparent hover:text-white hover:bg-[#111111]'
                            }`}
                            title={isSidebarCollapsed ? item.label : undefined}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {!isSidebarCollapsed && <span>{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Main Workspace */}
            <main className="flex-grow py-6 min-w-0 md:pl-6">
              {/* Workspace Header */}
              <div className="mb-6 pb-4 border-b border-[#1a1a1a]">
                <h2 className="text-sm font-black uppercase tracking-tight text-white">
                  {TAB_LABELS[adminActiveSubTab]}
                </h2>
              </div>

              {/* Tab Panels */}
              <div className="w-full">
                {adminActiveSubTab === 'dashboard' && <OverviewTab />}
                {adminActiveSubTab === 'novels' && <ManageNovelsTab />}
                {adminActiveSubTab === 'chapters' && <ManageChaptersTab handleDeleteChapter={handleDeleteChapter} />}
                {adminActiveSubTab === 'recommendations' && <RecommendationsTab />}
                {adminActiveSubTab === 'announcements' && <AnnouncementsTab />}
                {adminActiveSubTab === 'analytics' && <AnalyticsTab />}
                {adminActiveSubTab === 'settings' && <AdminSettingsTab />}
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
