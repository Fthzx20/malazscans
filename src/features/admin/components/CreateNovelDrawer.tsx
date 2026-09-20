import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';

interface CreateNovelDrawerProps {
  onSubmit: (e: React.FormEvent) => void;
}

interface SectionProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const PRESET_GENRES = [
  'Action', 'Fantasy', 'Isekai', 'Romance', 'Sci-Fi',
  'Xianxia', 'Comedy', 'Supernatural', 'Drama', 'Mystery', 'Slice of Life'
];

const FormSection: React.FC<SectionProps> = ({ title, badge, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#262626] bg-[#0A0A0A]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left border-none cursor-pointer bg-transparent"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black uppercase text-white tracking-wide">{title}</span>
          {badge && (
            <span className="text-[9px] font-mono text-[#FF3D00] bg-[#FF3D00]/10 border border-[#FF3D00]/20 px-1.5 py-0.5 uppercase font-bold">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-[#737373]" />
          : <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#262626]">
          {children}
        </div>
      )}
    </div>
  );
};

const inputCls = "w-full bg-[#111111] border border-[#2a2a2a] px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#FF3D00] rounded-none placeholder:text-[#444] transition-colors";
const labelCls = "text-[10px] text-[#737373] uppercase font-bold block mb-1.5 tracking-wider";

export const CreateNovelDrawer: React.FC<CreateNovelDrawerProps> = ({ onSubmit }) => {
  const {
    isNovelDrawerOpen,
    setIsNovelDrawerOpen,
    editingNovelId,
    resetNovelForm,
    adminNovelTitle, setAdminNovelTitle,
    adminNovelCustomSlug, setAdminNovelCustomSlug,
    adminNovelAlt, setAdminNovelAlt,
    adminNovelOriginalTitle, setAdminNovelOriginalTitle,
    adminNovelJapaneseTitle, setAdminNovelJapaneseTitle,
    adminNovelRomajiTitle, setAdminNovelRomajiTitle,
    adminNovelAuthor, setAdminNovelAuthor,
    adminNovelIllustrator, setAdminNovelIllustrator,
    adminNovelTranslator, setAdminNovelTranslator,
    adminNovelPublisher, setAdminNovelPublisher,
    adminNovelGenres, setAdminNovelGenres,
    adminNovelTags, setAdminNovelTags,
    adminNovelStatus, setAdminNovelStatus,
    adminNovelSchedule, setAdminNovelSchedule,
    adminNovelIsRecommended, setAdminNovelIsRecommended,
    adminNovelSynopsis, setAdminNovelSynopsis,
    adminNovelCoverImage, setAdminNovelCoverImage,
  } = useAdminStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverInputMode, setCoverInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const triggerToast = useNovelStore((state) => state.triggerToast);

  // ESC key closes drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNovelDrawerOpen) {
        resetNovelForm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isNovelDrawerOpen, resetNovelForm]);

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (isNovelDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isNovelDrawerOpen]);

  // Cover image handlers — uploads to R2
  const processFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      triggerToast('Only JPG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerToast('Cover image must be under 10MB.');
      return;
    }

    setIsUploadingCover(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'covers');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const { url } = await res.json();
      setAdminNovelCoverImage(url);
      triggerToast('Cover image uploaded successfully.');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to upload cover. Try direct URL or smaller image.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  if (!isNovelDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => resetNovelForm()}
      />

      {/* Drawer Panel */}
      <div className="relative w-full sm:max-w-2xl bg-[#0F0F0F] border-l border-[#262626] flex flex-col h-[100dvh] shadow-2xl overflow-hidden z-10">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#262626] bg-[#0A0A0A] flex-shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
              {editingNovelId ? 'Edit Novel' : 'Create Novel'}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-mono text-[#737373] mt-0.5">
              {editingNovelId ? 'Update novel metadata and cover.' : 'Register a new novel to the platform.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => resetNovelForm()}
            className="p-1.5 text-[#737373] hover:text-white hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer rounded-none"
            title="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="novel-drawer-form"
          onSubmit={onSubmit}
          className="flex-grow overflow-y-auto px-4 sm:px-6 py-5 space-y-4 scroll-smooth min-h-0"
        >

          {/* Section 1: Basic Information */}
          <FormSection title="Basic Information" badge="Required">
            <div className="space-y-1.5">
              <label className={labelCls}>Main Title</label>
              <input type="text" value={adminNovelTitle} onChange={e => setAdminNovelTitle(e.target.value)}
                placeholder="e.g. Adventure at the Edge of the Red Sunset" className={inputCls} required />
            </div>

            {/* Live Slug Preview & Custom Slug Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Custom URL Slug (Optional)</label>
                <span className="text-[9px] font-mono text-[#737373]">Auto-generated if empty</span>
              </div>
              <div className="flex items-center">
                <span className="bg-[#181818] border border-r-0 border-[#2a2a2a] px-3 py-2.5 text-[#737373] text-xs font-mono select-none">
                  /novel/
                </span>
                <input
                  type="text"
                  value={adminNovelCustomSlug}
                  onChange={(e) => setAdminNovelCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder={
                    adminNovelTitle
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '') || 'novel-slug'
                  }
                  className={`${inputCls} border-l-0`}
                />
              </div>
              <div className="text-[10px] font-mono text-[#737373] flex items-center gap-1.5 pt-0.5">
                <span className="text-[#555]">Live URL:</span>
                <span className="text-[#FF3D00] truncate">
                  malazscans.com/novel/
                  {adminNovelCustomSlug.trim() ||
                    adminNovelTitle
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '') ||
                    'novel-slug'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Alternative Title (English)</label>
                <input type="text" value={adminNovelAlt} onChange={e => setAdminNovelAlt(e.target.value)}
                  placeholder="Alt English name (optional)" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Original Title</label>
                <input type="text" value={adminNovelOriginalTitle} onChange={e => setAdminNovelOriginalTitle(e.target.value)}
                  placeholder="Original Japanese script" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Japanese Title</label>
                <input type="text" value={adminNovelJapaneseTitle} onChange={e => setAdminNovelJapaneseTitle(e.target.value)}
                  placeholder="Japanese kanji/kana" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Romaji Title</label>
                <input type="text" value={adminNovelRomajiTitle} onChange={e => setAdminNovelRomajiTitle(e.target.value)}
                  placeholder="Transliterated Romaji" className={inputCls} />
              </div>
            </div>
          </FormSection>

          {/* Section 2: People */}
          <FormSection title="People">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Author <span className="text-[#FF3D00]">*</span></label>
                <input type="text" value={adminNovelAuthor} onChange={e => setAdminNovelAuthor(e.target.value)}
                  placeholder="Kenji Takahashi" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Illustrator</label>
                <input type="text" value={adminNovelIllustrator} onChange={e => setAdminNovelIllustrator(e.target.value)}
                  placeholder="Shirabii" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Translator</label>
                <input type="text" value={adminNovelTranslator} onChange={e => setAdminNovelTranslator(e.target.value)}
                  placeholder="Malaz Scans" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Publisher</label>
                <input type="text" value={adminNovelPublisher} onChange={e => setAdminNovelPublisher(e.target.value)}
                  placeholder="Dengeki Bunko" className={inputCls} />
              </div>
            </div>
          </FormSection>

          {/* Section 3: Classification */}
          <FormSection title="Classification">
            {/* Preset Genre Pills */}
            <div className="space-y-1.5">
              <label className={labelCls}>Quick Genre Select</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GENRES.map((genre) => {
                  const currentList = adminNovelGenres
                    .split(',')
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean);
                  const isSelected = currentList.includes(genre.toLowerCase());
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        const rawList = adminNovelGenres
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        let updated: string[];
                        if (isSelected) {
                          updated = rawList.filter((g) => g.toLowerCase() !== genre.toLowerCase());
                        } else {
                          updated = [...rawList, genre];
                        }
                        setAdminNovelGenres(updated.join(', '));
                      }}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF3D00]/20 border-[#FF3D00] text-[#FF3D00]'
                          : 'bg-[#141414] border-[#262626] text-[#A3A3A3] hover:border-[#444] hover:text-white'
                      }`}
                    >
                      {isSelected ? `✓ ${genre}` : `+ ${genre}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Genres <span className="text-[#737373] normal-case">(comma separated)</span></label>
                <input type="text" value={adminNovelGenres} onChange={e => setAdminNovelGenres(e.target.value)}
                  placeholder="Fantasy, Action, Drama" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Tags <span className="text-[#737373] normal-case">(comma separated)</span></label>
                <input type="text" value={adminNovelTags} onChange={e => setAdminNovelTags(e.target.value)}
                  placeholder="Magic, Swordplay" className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Publication Status</label>
              <select value={adminNovelStatus} onChange={e => setAdminNovelStatus(e.target.value)}
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </FormSection>

          {/* Section 4: Publishing */}
          <FormSection title="Publishing">
            <div className="space-y-1.5">
              <label className={labelCls}>Release Schedule <span className="text-[#FF3D00]">*</span></label>
              <input type="text" value={adminNovelSchedule} onChange={e => setAdminNovelSchedule(e.target.value)}
                placeholder="Every Saturday" className={inputCls} required />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setAdminNovelIsRecommended(!adminNovelIsRecommended)}
                className={`w-10 h-5 rounded-full transition-all flex-shrink-0 relative cursor-pointer ${adminNovelIsRecommended ? 'bg-[#FF3D00]' : 'bg-[#262626]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${adminNovelIsRecommended ? 'left-5' : 'left-0.5'}`} />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Feature on Recommendations Carousel</span>
                <span className="text-[10px] text-[#737373] block font-mono">Appears on the homepage hero carousel</span>
              </div>
            </label>
          </FormSection>

          {/* Section 5: Cover Image */}
          <FormSection title="Cover Image" defaultOpen={true}>
            {adminNovelCoverImage ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-[#262626] bg-[#111111]">
                <img
                  src={adminNovelCoverImage}
                  alt="Cover preview"
                  className="w-20 h-28 object-cover border border-[#262626] flex-shrink-0 mx-auto sm:mx-0"
                />
                <div className="flex flex-col gap-2 flex-grow text-center sm:text-left">
                  <span className="text-xs font-mono text-white font-bold">Cover image loaded</span>
                  <span className="text-[10px] font-mono text-[#737373]">Preview on left. Use button below to remove or replace.</span>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminNovelCoverImage('');
                        setUrlInput('');
                      }}
                      className="text-[10px] font-mono font-bold border border-red-500/30 hover:border-red-500 text-red-400 px-3 py-1.5 bg-transparent cursor-pointer uppercase tracking-wide flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Cover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Mode Selector Tabs */}
                <div className="flex border-b border-[#262626] mb-4">
                  <button
                    type="button"
                    onClick={() => setCoverInputMode('upload')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px cursor-pointer ${
                      coverInputMode === 'upload'
                        ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/5'
                        : 'border-transparent text-[#737373] hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverInputMode('url')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px cursor-pointer ${
                      coverInputMode === 'url'
                        ? 'border-[#FF3D00] text-[#FF3D00] bg-[#FF3D00]/5'
                        : 'border-transparent text-[#737373] hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Direct URL
                  </button>
                </div>

                {coverInputMode === 'upload' ? (
                  isUploadingCover ? (
                    <div className="border-2 border-dashed border-[#FF3D00] bg-[#FF3D00]/5 py-8 flex flex-col items-center justify-center text-center px-4">
                      <Loader2 className="w-7 h-7 text-[#FF3D00] animate-spin mb-2" />
                      <span className="text-xs font-mono font-bold text-white block">Uploading cover to Cloudflare R2...</span>
                      <span className="text-[10px] font-mono text-[#737373] block mt-1">Please wait a moment</span>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed py-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all px-4 ${
                        isDragging ? 'border-[#FF3D00] bg-[#FF3D00]/5' : 'border-[#262626] hover:border-[#444]'
                      }`}
                    >
                      <Upload className="w-7 h-7 text-[#444] mb-2" />
                      <span className="text-xs font-mono font-bold text-[#737373] block">Drag & Drop cover image here</span>
                      <span className="text-[10px] font-mono text-[#555] block mt-1">or click to browse — JPG, PNG, WEBP · Max 10MB</span>
                    </div>
                  )
                ) : (
                  <div className="space-y-3 p-4 border border-[#262626] bg-[#0A0A0A]">
                    <label className={labelCls}>Public Image URL</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className={`${inputCls} flex-grow`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (urlInput.trim()) {
                            setAdminNovelCoverImage(urlInput.trim());
                            setUrlInput('');
                          }
                        }}
                        className="px-5 py-2.5 bg-[#FF3D00] hover:bg-white text-black text-xs font-mono font-black uppercase transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Load Image
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-[#737373]">
                      Provide an HTTPS link to an image file (JPG, PNG, WebP).
                    </p>
                  </div>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
            />
          </FormSection>

          {/* Section 6: Synopsis */}
          <FormSection title="Synopsis" badge="Required">
            <div className="space-y-1.5">
              <label className={labelCls}>Novel synopsis</label>
              <textarea
                rows={6}
                value={adminNovelSynopsis}
                onChange={e => setAdminNovelSynopsis(e.target.value)}
                placeholder="Provide a detailed synopsis of the novel. Describe the setting, protagonist, and main conflict..."
                className={`${inputCls} resize-y min-h-[140px]`}
                required
              />
            </div>
          </FormSection>
        </form>

        {/* Fixed Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[#262626] bg-[#0A0A0A] flex-shrink-0">
          <button
            type="button"
            onClick={() => resetNovelForm()}
            className="py-3 border border-[#262626] hover:border-[#737373] text-xs font-mono font-bold uppercase text-[#737373] hover:text-white bg-transparent cursor-pointer transition-all text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="novel-drawer-form"
            className="py-3 bg-[#FF3D00] hover:bg-white text-[#0A0A0A] text-xs font-mono font-black uppercase cursor-pointer border-none transition-colors text-center"
          >
            {editingNovelId ? 'Save Changes' : 'Register Novel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNovelDrawer;
