export interface Chapter {
  id: string;
  title: string;
  publishDate: string;
  content: string; // Tiptap JSON string or legacy text
  volumeTitle?: string;
}

export interface Volume {
  volumeNumber: number;
  title: string;
  chapters: Chapter[];
}

export interface Novel {
  id: string;
  title: string;
  alternativeTitle: string;
  originalTitle: string;
  japaneseTitle: string;
  romajiTitle: string;
  author: string;
  illustrator: string;
  translator: string;
  publisher: string;
  synopsis: string;
  status: string; // 'ONGOING' | 'COMPLETED'
  releaseSchedule: string;
  addedDate: string;
  rating: string;
  ratingCount?: number;
  bookmarkCount?: number;
  views: string;
  genres: string[];
  tags: string[];
  coverImage?: string; // base64 data URL or standard URL
  isRecommended: boolean;
  volumes: Volume[];
}

export interface Illustration {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  chapterId: string;
}

export interface Recommendation {
  id: string;
  novelId: string;
  order: number;
  isPinned: boolean;
  isFeatured: boolean;
  addedDate: string;
}

export interface User {
  username: string;
  email: string;
  avatar?: string; // base64 or URL
  password?: string;
}

export interface ReadingHistory {
  novelId: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: string;
}

export interface ReaderSettings {
  fontSize: string; // e.g., 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl'
  lineHeight: string; // e.g., 'leading-snug' | 'leading-normal' | 'leading-relaxed' | 'leading-loose'
  paragraphSpacing: string; // e.g., 'space-y-4' | 'space-y-6' | 'space-y-8'
  contentWidth: string; // e.g., 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl'
  theme: 'light' | 'dark' | 'sepia' | 'amoled';
  fontFamily: string; // e.g., 'font-serif' | 'font-sans' | 'font-mono' | 'font-outfit'
  autoBookmark: boolean;
  autoSaveProgress: boolean;
  rememberPosition: boolean;
  hideMatureContent: boolean;
  showIllustrations: boolean;
  showTranslatorNotes: boolean;
  showAuthorNotes: boolean;
  newChapterNotify: boolean;
  announcementNotify: boolean;
}

export interface Comment {
  id: number;
  parentId?: number;
  chapterId: string;
  user: string;
  text: string;
  date: string;
  isUserRegistered: boolean;
  reactions: {
    likes: string[]; // array of usernames who liked
    hearts: string[]; // array of usernames who hearted
  };
  replies: Comment[];
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  priority: "low" | "medium" | "high";
  autoClose: boolean;
  autoCloseSeconds: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export type Bookmark = string; // novelId
