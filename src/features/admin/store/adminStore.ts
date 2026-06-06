import { create } from 'zustand';

interface AdminState {
  adminActiveSubTab: 'dashboard' | 'novels' | 'chapters' | 'recommendations' | 'analytics' | 'settings' | 'announcements' | 'users';
  editingNovelId: string | null;
  editingChapterId: string | null;
  activeEditorMode: 'create' | 'edit' | null;
  selectedAdminNovelId: string;
  isNovelDrawerOpen: boolean;
  isSidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  
  // Expanded Novel Form inputs
  adminNovelTitle: string;
  adminNovelAlt: string;
  adminNovelOriginalTitle: string;
  adminNovelJapaneseTitle: string;
  adminNovelRomajiTitle: string;
  adminNovelAuthor: string;
  adminNovelIllustrator: string;
  adminNovelTranslator: string;
  adminNovelPublisher: string;
  adminNovelGenres: string; // Comma separated genres e.g. "Fantasy, Sci-Fi"
  adminNovelTags: string; // Comma separated tags e.g. "Space, Magic"
  adminNovelStatus: string;
  adminNovelSchedule: string;
  adminNovelIsRecommended: boolean;
  adminNovelSynopsis: string;
  adminNovelCoverImage: string; // Base64 data string

  // Chapter Form inputs
  adminChapTitle: string;
  adminChapContent: string;

  setAdminActiveSubTab: (tab: 'dashboard' | 'novels' | 'chapters' | 'recommendations' | 'analytics' | 'settings' | 'announcements' | 'users') => void;
  setEditingNovelId: (id: string | null) => void;
  setEditingChapterId: (id: string | null) => void;
  setActiveEditorMode: (mode: 'create' | 'edit' | null) => void;
  setSelectedAdminNovelId: (id: string) => void;
  setIsNovelDrawerOpen: (open: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setIsMobileNavOpen: (open: boolean) => void;
  
  // Novel Form setters
  setAdminNovelTitle: (val: string) => void;
  setAdminNovelAlt: (val: string) => void;
  setAdminNovelOriginalTitle: (val: string) => void;
  setAdminNovelJapaneseTitle: (val: string) => void;
  setAdminNovelRomajiTitle: (val: string) => void;
  setAdminNovelAuthor: (val: string) => void;
  setAdminNovelIllustrator: (val: string) => void;
  setAdminNovelTranslator: (val: string) => void;
  setAdminNovelPublisher: (val: string) => void;
  setAdminNovelGenres: (val: string) => void;
  setAdminNovelTags: (val: string) => void;
  setAdminNovelStatus: (val: string) => void;
  setAdminNovelSchedule: (val: string) => void;
  setAdminNovelIsRecommended: (val: boolean) => void;
  setAdminNovelSynopsis: (val: string) => void;
  setAdminNovelCoverImage: (val: string) => void;

  // Chapter Form setters
  setAdminChapTitle: (val: string) => void;
  setAdminChapContent: (val: string) => void;

  resetNovelForm: () => void;
  resetChapterForm: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  adminActiveSubTab: 'dashboard',
  editingNovelId: null,
  editingChapterId: null,
  activeEditorMode: null,
  selectedAdminNovelId: '',
  isNovelDrawerOpen: false,
  isSidebarCollapsed: false,
  isMobileNavOpen: false,

  adminNovelTitle: '',
  adminNovelAlt: '',
  adminNovelOriginalTitle: '',
  adminNovelJapaneseTitle: '',
  adminNovelRomajiTitle: '',
  adminNovelAuthor: '',
  adminNovelIllustrator: '',
  adminNovelTranslator: 'Alex Mercer',
  adminNovelPublisher: '',
  adminNovelGenres: 'Fantasy',
  adminNovelTags: 'Swordplay, Magic',
  adminNovelStatus: 'ONGOING',
  adminNovelSchedule: 'Every Saturday',
  adminNovelIsRecommended: false,
  adminNovelSynopsis: '',
  adminNovelCoverImage: '',

  adminChapTitle: '',
  adminChapContent: '',

  setAdminActiveSubTab: (tab) => set({ adminActiveSubTab: tab }),
  setEditingNovelId: (id) => set({ editingNovelId: id }),
  setEditingChapterId: (id) => set({ editingChapterId: id }),
  setActiveEditorMode: (mode) => set({ activeEditorMode: mode }),
  setSelectedAdminNovelId: (id) => set({ selectedAdminNovelId: id }),
  setIsNovelDrawerOpen: (open) => set({ isNovelDrawerOpen: open }),
  setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setIsMobileNavOpen: (open) => set({ isMobileNavOpen: open }),

  setAdminNovelTitle: (val) => set({ adminNovelTitle: val }),
  setAdminNovelAlt: (val) => set({ adminNovelAlt: val }),
  setAdminNovelOriginalTitle: (val) => set({ adminNovelOriginalTitle: val }),
  setAdminNovelJapaneseTitle: (val) => set({ adminNovelJapaneseTitle: val }),
  setAdminNovelRomajiTitle: (val) => set({ adminNovelRomajiTitle: val }),
  setAdminNovelAuthor: (val) => set({ adminNovelAuthor: val }),
  setAdminNovelIllustrator: (val) => set({ adminNovelIllustrator: val }),
  setAdminNovelTranslator: (val) => set({ adminNovelTranslator: val }),
  setAdminNovelPublisher: (val) => set({ adminNovelPublisher: val }),
  setAdminNovelGenres: (val) => set({ adminNovelGenres: val }),
  setAdminNovelTags: (val) => set({ adminNovelTags: val }),
  setAdminNovelStatus: (val) => set({ adminNovelStatus: val }),
  setAdminNovelSchedule: (val) => set({ adminNovelSchedule: val }),
  setAdminNovelIsRecommended: (val) => set({ adminNovelIsRecommended: val }),
  setAdminNovelSynopsis: (val) => set({ adminNovelSynopsis: val }),
  setAdminNovelCoverImage: (val) => set({ adminNovelCoverImage: val }),

  setAdminChapTitle: (val) => set({ adminChapTitle: val }),
  setAdminChapContent: (val) => set({ adminChapContent: val }),

  resetNovelForm: () => set({
    editingNovelId: null,
    isNovelDrawerOpen: false,
    adminNovelTitle: '',
    adminNovelAlt: '',
    adminNovelOriginalTitle: '',
    adminNovelJapaneseTitle: '',
    adminNovelRomajiTitle: '',
    adminNovelAuthor: '',
    adminNovelIllustrator: '',
    adminNovelTranslator: 'Alex Mercer',
    adminNovelPublisher: '',
    adminNovelGenres: 'Fantasy',
    adminNovelTags: 'Swordplay, Magic',
    adminNovelStatus: 'ONGOING',
    adminNovelSchedule: 'Every Saturday',
    adminNovelIsRecommended: false,
    adminNovelSynopsis: '',
    adminNovelCoverImage: '',
  }),

  resetChapterForm: () => set({
    editingChapterId: null,
    adminChapTitle: '',
    adminChapContent: '',
  })
}));

export default useAdminStore;
