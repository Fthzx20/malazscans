import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Save, Bold, Italic, Underline as UnderlineIcon, List, ImageIcon } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

import { useAdminStore } from '../store/adminStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { getChapterJSON } from '../utils/editor';

interface SystemEditorProps {
  handleSaveChapter: () => void;
}

export const SystemEditor: React.FC<SystemEditorProps> = ({ handleSaveChapter }) => {
  const novels = useNovelStore((state) => state.novels);
  const triggerToast = useNovelStore((state) => state.triggerToast);
  
  const selectedAdminNovelId = useAdminStore((state) => state.selectedAdminNovelId);
  const editingChapterId = useAdminStore((state) => state.editingChapterId);
  const activeEditorMode = useAdminStore((state) => state.activeEditorMode);
  const setActiveEditorMode = useAdminStore((state) => state.setActiveEditorMode);
  const setEditingChapterId = useAdminStore((state) => state.setEditingChapterId);
  
  const adminChapTitle = useAdminStore((state) => state.adminChapTitle);
  const setAdminChapTitle = useAdminStore((state) => state.setAdminChapTitle);
  const adminChapContent = useAdminStore((state) => state.adminChapContent);
  const setAdminChapContent = useAdminStore((state) => state.setAdminChapContent);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetNovel = novels.find(n => n.id === selectedAdminNovelId);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,      // Disabled — configured separately below with openOnClick: false
        underline: false, // Disabled — configured separately below
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start typing your manuscript here. Use formatting buttons above or paste/drag images directly into the sheet.',
        emptyEditorClass: 'is-editor-empty',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: getChapterJSON(adminChapContent),
    editorProps: {
      attributes: {
        class: 'w-full flex-grow bg-transparent text-base sm:text-lg text-white/95 font-serif leading-relaxed focus:outline-none min-h-[700px] outline-none',
      },
      // Allow editing of image alt/caption when clicked inside the editor
      handleClickOn: (view, pos, node, nodePos, event, direct) => {
        if (node.type.name === 'image') {
          const currentAlt = node.attrs.alt || '';
          // Helper to check if string looks like a filename/placeholder
          const isClean = (str: string) => {
            if (!str) return false;
            const s = str.trim();
            if (/\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(s)) return false;
            if (s.toLowerCase() === 'pasted image') return false;
            if (!/\s/.test(s) && (/[_-]/.test(s) || /\d/.test(s))) return false;
            return true;
          };
          const promptDefault = isClean(currentAlt) ? currentAlt : '';
          const newAlt = window.prompt('Enter/edit illustration caption (leave empty for none):', promptDefault);
          if (newAlt !== null) {
            view.dispatch(view.state.tr.setNodeMarkup(nodePos, undefined, {
              ...node.attrs,
              alt: newAlt.trim()
            }));
          }
          return true;
        }
        return false;
      },
      // Handle image drag & drop directly inside the Tiptap editor canvas
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            if (file.size <= 10 * 1024 * 1024) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const base64 = readerEvent.target?.result as string;
                view.dispatch(view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: base64, alt: file.name })
                ));
              };
              reader.readAsDataURL(file);
              return true;
            } else {
              triggerToast("Image size must be less than 10MB.");
            }
          }
        }
        return false;
      },
      // Handle image copy-paste directly inside the editor canvas
      handlePaste: (view, event, slice) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            if (file.size <= 10 * 1024 * 1024) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const base64 = readerEvent.target?.result as string;
                view.dispatch(view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: base64, alt: 'Pasted Image' })
                ));
              };
              reader.readAsDataURL(file);
              return true;
            } else {
              triggerToast("Image size must be less than 10MB.");
            }
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      setAdminChapContent(JSON.stringify(editor.getJSON()));
    },
  });

  // Sync content when chapter selection changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentJSON = getChapterJSON(adminChapContent);
      const editorJSON = editor.getJSON();
      if (JSON.stringify(currentJSON) !== JSON.stringify(editorJSON)) {
        editor.commands.setContent(currentJSON);
      }
    }
  }, [editingChapterId, editor]);

  // Autosave content every 5 seconds
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      const jsonContent = editor.getJSON();
      const draft = {
        novelId: selectedAdminNovelId,
        chapterId: editingChapterId,
        title: adminChapTitle,
        content: jsonContent,
        timestamp: Date.now()
      };
      localStorage.setItem('kult_editor_draft', JSON.stringify(draft));
    }, 5000);

    return () => clearInterval(interval);
  }, [editor, selectedAdminNovelId, editingChapterId, adminChapTitle]);

  // Restore draft content automatically on mount
  useEffect(() => {
    if (!editor) return;

    const savedDraft = localStorage.getItem('kult_editor_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.novelId === selectedAdminNovelId && draft.chapterId === editingChapterId) {
          setAdminChapTitle(draft.title);
          editor.commands.setContent(draft.content);
          setAdminChapContent(JSON.stringify(draft.content));
          triggerToast("Auto-save draft restored successfully.");
        }
      } catch (e) {
        // Fail silently
      }
    }
  }, [editor, selectedAdminNovelId, editingChapterId, setAdminChapTitle, setAdminChapContent, triggerToast]);

  const getWordCount = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const handleCancel = () => {
    setActiveEditorMode(null);
    setEditingChapterId(null);
    localStorage.removeItem('kult_editor_draft');
  };

  const handleToolbarImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editor) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        triggerToast("Image size must be less than 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        editor.chain().focus().setImage({ src: base64, alt: file.name }).run();
        triggerToast("Image inserted into editor.");
      };
      reader.readAsDataURL(file);
    }
  };

  const plainText = editor?.getText() || '';
  const wordCount = getWordCount(plainText);
  const charCount = plainText.length;

  return (
    <div className="space-y-6">
      {/* Editor Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-4">
        <div className="space-y-1">
          <button 
            onClick={handleCancel}
            className="inline-flex items-center space-x-1 text-xs font-mono text-[#737373] hover:text-[#FF3D00] mb-1 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chapters</span>
          </button>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white font-sans">
            {activeEditorMode === 'edit' ? 'Manuscript Editor' : 'Write New Chapter'}
          </h2>
          <p className="text-xs font-mono text-[#737373]">
            Writing for: <strong className="text-white">{targetNovel?.title}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={handleCancel}
            className="border border-[#262626] text-white hover:border-[#FF3D00] text-xs font-mono font-bold uppercase py-2.5 px-4 rounded-none bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveChapter}
            className="bg-[#FF3D00] text-[#0A0A0A] hover:bg-white text-xs font-mono font-bold uppercase py-2.5 px-6 flex items-center gap-1.5 rounded-none cursor-pointer border-none"
          >
            <Save className="w-4 h-4" />
            <span>Save Chapter</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT EDITOR SHEET */}
      <div className="bg-[#050505] border border-[#262626] p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-5xl space-y-6">
          
          {/* Floating Action Formatting Toolbar */}
          <div className="sticky top-20 bg-[#0F0F0F] border border-[#262626] p-3 flex flex-wrap items-center gap-1.5 z-20">
            <button 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all font-bold border-none cursor-pointer ${
                editor?.isActive('bold') ? 'bg-[#FF3D00] text-[#0A0A0A]' : 'text-[#FAFAFA] bg-transparent'
              }`}
              title="Bold"
            >
              <Bold className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all italic border-none cursor-pointer ${
                editor?.isActive('italic') ? 'bg-[#FF3D00] text-[#0A0A0A]' : 'text-[#FAFAFA] bg-transparent'
              }`}
              title="Italic"
            >
              <Italic className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-2 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all border-none cursor-pointer ${
                editor?.isActive('underline') ? 'bg-[#FF3D00] text-[#0A0A0A]' : 'text-[#FAFAFA] bg-transparent'
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-4.5 h-4.5" />
            </button>
            <span className="w-px h-6 bg-[#262626] mx-1"></span>
            
            <button 
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 text-xs font-mono font-bold hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all border-none cursor-pointer ${
                editor?.isActive('heading', { level: 1 }) ? 'bg-[#FF3D00] text-[#0A0A0A]' : 'text-[#FAFAFA] bg-transparent'
              }`}
              title="Header 1"
            >
              H1
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 text-xs font-mono font-bold hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all border-none cursor-pointer ${
                editor?.isActive('heading', { level: 2 }) ? 'bg-[#FF3D00] text-[#0A0A0A]' : 'text-[#FAFAFA] bg-transparent'
              }`}
              title="Header 2"
            >
              H2
            </button>
            <button 
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 hover:bg-[#FF3D00] hover:text-[#0A0A0A] transition-all border-none cursor-pointer ${
                editor?.isActive('bulletList') ? 'bg-[#FF3D00] text-[#0A0A0A]' : 'text-[#FAFAFA] bg-transparent'
              }`}
              title="Bullet List"
            >
              <List className="w-4.5 h-4.5" />
            </button>
            <span className="w-px h-6 bg-[#262626] mx-1"></span>
            
            {/* Direct Image Upload button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-[#FF3D00] hover:text-[#0A0A0A] text-white transition-all bg-transparent border-none cursor-pointer"
              title="Insert Illustration Image"
            >
              <ImageIcon className="w-4.5 h-4.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleToolbarImageSelect} 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
            />

            {/* Embedded Illustration Shortcut Button */}
            <button 
              onClick={() => editor?.chain().focus().insertContent('[ILLUSTRATION:rs-v1-c1-illus]').run()}
              className="px-3 py-1.5 border border-[#262626] text-[10px] font-mono text-white hover:border-[#FF3D00] transition-all uppercase font-bold bg-transparent cursor-pointer"
              title="Tag Legacy Illustration"
            >
              + Tag Illustration
            </button>

            {/* Translator Note Shortcut Button */}
            <button 
              onClick={() => editor?.chain().focus().insertContent('[TN: Type translator note here]').run()}
              className="px-3 py-1.5 border border-[#262626] text-[10px] font-mono text-white hover:border-[#FF3D00] transition-all uppercase font-bold bg-transparent cursor-pointer"
              title="Insert Translator Note"
            >
              + Translator Note
            </button>

            {/* Author Note Shortcut Button */}
            <button 
              onClick={() => editor?.chain().focus().insertContent('[AN: Type author note here]').run()}
              className="px-3 py-1.5 border border-[#262626] text-[10px] font-mono text-white hover:border-[#FF3D00] transition-all uppercase font-bold bg-transparent cursor-pointer"
              title="Insert Author Note"
            >
              + Author Note
            </button>
            <span className="ml-auto text-[10px] font-mono text-[#737373] hidden sm:inline">Tiptap Engine</span>
          </div>

          {/* Expanded Paper Layout */}
          <div className="bg-[#0F0F0F] border border-[#262626] min-h-[900px] p-6 sm:p-16 shadow-2xl flex flex-col space-y-8">
            {/* Document Title input */}
            <div className="border-b border-[#262626] pb-5">
              <input 
                type="text"
                value={adminChapTitle}
                onChange={(e) => setAdminChapTitle(e.target.value)}
                placeholder="Enter chapter title... (e.g. Awakening of the Dragon)"
                className="w-full bg-transparent text-2xl sm:text-4xl font-black text-white focus:outline-none uppercase tracking-tight placeholder:text-[#262626]"
                required
              />
              <span className="text-[10px] font-mono text-[#737373] mt-2 block">Target: Volume 1</span>
            </div>

            {/* Document Body Area */}
            <div className="flex-grow flex flex-col">
              <EditorContent editor={editor} />
            </div>

            {/* Status Bar */}
            <div className="border-t border-[#262626] pt-5 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-[#737373] gap-2">
              <div className="flex items-center space-x-4">
                <span>WORD COUNT: <strong className="text-white">{wordCount}</strong></span>
                <span>CHARACTERS: <strong className="text-white">{charCount}</strong></span>
              </div>
              <span className="text-[#FF3D00] font-bold uppercase animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#FF3D00] rounded-full"></span> Autosave active to local cache
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SystemEditor;
