-- ============================================================
-- TURSO (libSQL / SQLite) SCHEMA FOR CONTENT
-- Database: Turso Edge Database
-- Target: Novels, Volumes, Chapters, Illustrations, Announcements
-- ============================================================

-- Novels Table
CREATE TABLE IF NOT EXISTS novels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  alternativeTitle TEXT DEFAULT '',
  originalTitle TEXT DEFAULT '',
  japaneseTitle TEXT DEFAULT '',
  romajiTitle TEXT DEFAULT '',
  author TEXT NOT NULL,
  illustrator TEXT DEFAULT '',
  translator TEXT DEFAULT '',
  publisher TEXT DEFAULT '',
  synopsis TEXT DEFAULT '',
  status TEXT DEFAULT 'ONGOING',
  releaseSchedule TEXT DEFAULT '',
  addedDate TEXT DEFAULT (datetime('now')),
  rating REAL DEFAULT 0.0,
  ratingCount INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  genres TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  coverImage TEXT,
  isRecommended INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status);
CREATE INDEX IF NOT EXISTS idx_novels_addedDate ON novels(addedDate);

-- Volumes Table
CREATE TABLE IF NOT EXISTS volumes (
  id TEXT PRIMARY KEY,
  volumeNumber INTEGER NOT NULL,
  title TEXT NOT NULL,
  novelId TEXT NOT NULL,
  FOREIGN KEY (novelId) REFERENCES novels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_volumes_novelId ON volumes(novelId);

-- Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publishDate TEXT DEFAULT (datetime('now')),
  content TEXT NOT NULL,
  isLocked INTEGER DEFAULT 0,
  coinPrice INTEGER DEFAULT 5,
  volumeId TEXT NOT NULL,
  FOREIGN KEY (volumeId) REFERENCES volumes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chapters_volumeId ON chapters(volumeId);
CREATE INDEX IF NOT EXISTS idx_chapters_publishDate ON chapters(publishDate);

-- Illustrations Table
CREATE TABLE IF NOT EXISTS illustrations (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  alt TEXT DEFAULT '',
  chapterId TEXT NOT NULL,
  FOREIGN KEY (chapterId) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_illustrations_chapterId ON illustrations(chapterId);

-- Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  novelId TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  isPinned INTEGER DEFAULT 0,
  isFeatured INTEGER DEFAULT 0,
  addedDate TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recommendations_novelId ON recommendations(novelId);
CREATE INDEX IF NOT EXISTS idx_recommendations_order ON recommendations("order");

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  autoDismissDuration INTEGER DEFAULT 10,
  status TEXT DEFAULT 'draft',
  displayMode TEXT DEFAULT 'modal',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, startDate, endDate);
