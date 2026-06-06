import React, { useState } from 'react';
import Image from 'next/image';
import { Chapter } from '../../../types';
import { ILLUSTRATIONS } from '../../../assets/illustrations';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { getChapterJSON } from '../../admin/utils/editor';
import { JSONContent } from '@tiptap/react';
import { getThemeStyles } from '../utils/theme';
import { IllustrationViewer, IllustrationItem } from '../../../components/modals/IllustrationViewer';
import { NovelMentionRenderer } from '../../novels/components/NovelMentionRenderer';
import { useNovelStore } from '../../novels/store/novelStore';

interface ReaderContentProps {
  chapter: Chapter;
}

// Cleans filenames, UUIDs, upload names and internal identifiers from caption display
const getCleanCaption = (caption: string): string => {
  if (!caption) return '';
  const trimmed = caption.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // Exclude default placeholder labels
  if (
    lower === 'pasted image' ||
    lower === 'light novel illustration' ||
    lower === 'illustration empty' ||
    lower === 'light novel internal illustration'
  ) {
    return '';
  }

  // Exclude standard image file extension endings
  if (/\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff|heic)$/i.test(trimmed)) {
    return '';
  }

  // Exclude IDs, storage names, and internal markers (no spaces, containing numbers, dashes or underscores)
  const noSpace = !/\s/.test(trimmed);
  if (noSpace) {
    if (/^[a-f0-9-]{36}$/i.test(trimmed)) return ''; // UUID check
    if (/^[a-zA-Z0-9_\-]+$/i.test(trimmed)) {
      if (/[_-]/.test(trimmed) || /\d/.test(trimmed)) {
        return '';
      }
    }
  }

  return trimmed;
};

export const ReaderContent: React.FC<ReaderContentProps> = ({ chapter }) => {
  const { readerSettings, showIllustrations } = useReaderSettings();
  const novels = useNovelStore((state) => state.novels);
  const doc = getChapterJSON(chapter.content);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const parseNoteMentions = (text: string) => {
    const parts = text.split(/(\[\[.+?\]\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const title = part.slice(2, -2);
        const novel = novels.find(
          (n) =>
            n.title.toLowerCase() === title.toLowerCase() ||
            n.alternativeTitle.toLowerCase() === title.toLowerCase() ||
            n.romajiTitle.toLowerCase() === title.toLowerCase()
        );
        if (novel) {
          return (
            <NovelMentionRenderer
              key={idx}
              novelId={novel.id}
              title={novel.title}
            />
          );
        }
        return <span key={idx} className="font-mono">[[{title}]]</span>;
      }
      return part;
    });
  };

  // Scan and build order of all illustrations in this chapter
  const illustrations: IllustrationItem[] = [];
  if (doc.content) {
    doc.content.forEach((node, nodeIdx) => {
      // Legacy illustration match
      if (node.type === 'paragraph' && node.content && node.content.length === 1) {
        const textNode = node.content[0];
        if (textNode.type === 'text' && textNode.text && textNode.text.startsWith('[ILLUSTRATION:')) {
          const key = textNode.text.replace('[ILLUSTRATION:', '').replace(']', '');
          if (showIllustrations && ILLUSTRATIONS[key]) {
            illustrations.push({
              id: `legacy-${nodeIdx}`,
              type: 'legacy',
              key,
              caption: 'Light Novel Illustration',
              element: ILLUSTRATIONS[key]
            });
          }
        }
      }

      // Tiptap image node match
      if (node.type === 'image' && node.attrs?.src && showIllustrations) {
        const alt = node.attrs.alt || '';
        const cleaned = getCleanCaption(alt);
        illustrations.push({
          id: `image-${nodeIdx}`,
          type: 'image',
          src: node.attrs.src,
          alt: alt,
          caption: cleaned
        });
      }
    });
  }

  const renderTextNode = (node: JSONContent, idx: number) => {
    if (node.type !== 'text' || !node.text) return null;
    let element: React.ReactNode = node.text;

    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type === 'bold') {
          element = <strong key={mark.type}>{element}</strong>;
        } else if (mark.type === 'italic') {
          element = <em key={mark.type}>{element}</em>;
        } else if (mark.type === 'underline') {
          element = <span key={mark.type} style={{ textDecoration: 'underline' }}>{element}</span>;
        } else if (mark.type === 'link' && mark.attrs?.href) {
          element = (
            <a 
              key={mark.type} 
              href={mark.attrs.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF3D00] hover:underline"
            >
              {element}
            </a>
          );
        }
      });
    }

    return <span key={idx}>{element}</span>;
  };

  const renderNode = (node: JSONContent, idx: number): React.ReactNode => {
    if (!node) return null;

    // Detect legacy illustration syntax inside paragraph or block
    if (node.type === 'paragraph' && node.content && node.content.length === 1) {
      const textNode = node.content[0];
      if (textNode.type === 'text' && textNode.text) {
        if (textNode.text.startsWith('[ILLUSTRATION:')) {
          const key = textNode.text.replace('[ILLUSTRATION:', '').replace(']', '');
          const illustrationNode = ILLUSTRATIONS[key];
          
          if (!showIllustrations) return null;

          const illusIdx = illustrations.findIndex(item => item.type === 'legacy' && item.key === key);
          
          return (
            <div 
              key={idx} 
              className="my-8 space-y-2 text-center clear-both cursor-pointer group select-none"
              onClick={() => illusIdx !== -1 && setViewerIndex(illusIdx)}
            >
              <div className="bg-[#0F0F0F] p-4 border border-[#262626] flex justify-center items-center group-hover:border-[#FF3D00] transition-colors">
                {illustrationNode || <div className="text-xs font-mono text-red-500">Illustration Empty</div>}
              </div>
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest block font-bold">
                [Click to Expand Illustration]
              </span>
            </div>
          );
        }

        if (textNode.text.startsWith('[TN:')) {
          if (!readerSettings.showTranslatorNotes) return null;
          const noteText = textNode.text.replace(/^\[TN:\s*/, '').replace(/\]$/, '');
          return (
            <div key={idx} className="my-4 p-4 border-l-4 border-blue-500 bg-blue-500/5 text-xs font-mono rounded-none text-left">
              <span className="text-blue-400 font-extrabold uppercase block text-[9px] mb-1">Translator&apos;s Note:</span>
              <span className="text-[#D4D4D4] leading-relaxed">{parseNoteMentions(noteText)}</span>
            </div>
          );
        }

        if (textNode.text.startsWith('[AN:')) {
          if (!readerSettings.showAuthorNotes) return null;
          const noteText = textNode.text.replace(/^\[AN:\s*/, '').replace(/\]$/, '');
          return (
            <div key={idx} className="my-4 p-4 border-l-4 border-amber-500 bg-amber-500/5 text-xs font-mono rounded-none text-left">
              <span className="text-amber-400 font-extrabold uppercase block text-[9px] mb-1">Author&apos;s Note:</span>
              <span className="text-[#D4D4D4] leading-relaxed">{parseNoteMentions(noteText)}</span>
            </div>
          );
        }
      }
    }

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={idx} className="indent-4 text-justify">
            {node.content ? node.content.map((child, cIdx) => renderTextNode(child, cIdx)) : <br />}
          </p>
        );
      case 'heading': {
        const level = node.attrs?.level || 1;
        const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const classes = level === 1 ? 'text-2xl font-black mt-8 mb-4 uppercase tracking-tight' : 'text-xl font-bold mt-6 mb-3 uppercase';
        return (
          <Tag key={idx} className={classes}>
            {node.content ? node.content.map((child, cIdx) => renderTextNode(child, cIdx)) : null}
          </Tag>
        );
      }
      case 'bulletList':
        return (
          <ul key={idx} className="list-disc pl-6 space-y-2 my-4 text-left">
            {node.content ? node.content.map((child, cIdx) => renderNode(child, cIdx)) : null}
          </ul>
        );
      case 'orderedList':
        return (
          <ol key={idx} className="list-decimal pl-6 space-y-2 my-4 text-left">
            {node.content ? node.content.map((child, cIdx) => renderNode(child, cIdx)) : null}
          </ol>
        );
      case 'listItem':
        return (
          <li key={idx}>
            {node.content ? node.content.map((child, cIdx) => renderNode(child, cIdx)) : null}
          </li>
        );
      case 'blockquote':
        return (
          <blockquote key={idx} className="border-l-4 border-[#FF3D00] pl-4 italic my-4 text-[#A3A3A3] text-left">
            {node.content ? node.content.map((child, cIdx) => renderNode(child, cIdx)) : null}
          </blockquote>
        );
      case 'horizontalRule':
        return <hr key={idx} className={`border-t ${themeStyles.border} my-8`} />;
      case 'image': {
        const src = node.attrs?.src;
        const alt = node.attrs?.alt || '';
        const alignment = node.attrs?.alignment || 'center'; // center, full-width, inline-left
        
        if (!showIllustrations || !src) return null;

        let alignClass = 'mx-auto max-w-full';
        if (alignment === 'full-width') {
          alignClass = 'w-full';
        } else if (alignment === 'inline-left') {
          alignClass = 'float-left mr-6 mb-4 max-w-sm';
        }

        const cleanedCaption = getCleanCaption(alt);
        const illusIdx = illustrations.findIndex(item => item.type === 'image' && item.src === src);

        return (
          <figure 
            key={idx} 
            className={`my-8 space-y-2 text-center clear-both cursor-pointer group ${alignClass}`}
            onClick={() => illusIdx !== -1 && setViewerIndex(illusIdx)}
          >
            <div className="bg-[#0F0F0F] p-4 border border-[#262626] flex items-center justify-center overflow-hidden group-hover:border-[#FF3D00] transition-colors select-none">
              <Image 
                src={src} 
                alt={alt || "Illustration"} 
                width={800} 
                height={500} 
                loading="lazy" 
                unoptimized={src.startsWith('data:')}
                className="max-h-[600px] object-contain w-auto h-auto max-w-full transition-transform duration-200 group-hover:scale-[1.01]" 
              />
            </div>
            {cleanedCaption && (
              <figcaption className="text-xs font-mono text-[#737373] uppercase tracking-widest block select-none">
                {cleanedCaption}
              </figcaption>
            )}
          </figure>
        );
      }
      default:
        return null;
    }
  };

  return (
    <section 
      className={`mx-auto ${readerSettings.fontFamily} ${readerSettings.fontSize} ${readerSettings.lineHeight} ${readerSettings.paragraphSpacing} ${readerSettings.contentWidth} leading-relaxed select-none`}
      style={{ userSelect: 'none' }}
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {doc.content ? doc.content.map((node, idx) => renderNode(node, idx)) : null}

      {viewerIndex !== null && (
        <IllustrationViewer
          illustrations={illustrations}
          activeIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={(idx) => setViewerIndex(idx)}
        />
      )}
    </section>
  );
};

export default ReaderContent;
