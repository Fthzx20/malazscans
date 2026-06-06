import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';
import { NovelMentionDropdown, MentionNovelItem } from './NovelMentionDropdown';

interface NovelMentionInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue: (value: string) => void;
}

export const NovelMentionInput: React.FC<NovelMentionInputProps> = ({
  value,
  onChangeValue,
  placeholder,
  className = '',
  rows = 3,
  disabled = false,
  ...props
}) => {
  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [items, setItems] = useState<MentionNovelItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerIdx, setTriggerIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search trigger
  useEffect(() => {
    if (!dropdownOpen || searchQuery.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mentions/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Failed to fetch novel mentions:', err);
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, dropdownOpen]);

  // Handle input changes and check for mention trigger
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChangeValue(text);

    const selectionEnd = e.target.selectionEnd || 0;
    const textBeforeCursor = text.substring(0, selectionEnd);
    const lastTrigger = textBeforeCursor.lastIndexOf('[[');

    if (lastTrigger !== -1) {
      const textAfterTrigger = textBeforeCursor.substring(lastTrigger + 2);
      // Ensure there are no closing brackets between trigger and cursor
      if (!textAfterTrigger.includes(']]')) {
        setTriggerIdx(lastTrigger);
        setSearchQuery(textAfterTrigger);
        setDropdownOpen(true);
        return;
      }
    }

    setDropdownOpen(false);
    setSearchQuery('');
    setItems([]);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setItems([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectNovel = (novel: MentionNovelItem) => {
    if (!textareaRef.current) return;

    const cursorIdx = textareaRef.current.selectionStart || 0;
    const beforeTrigger = value.substring(0, triggerIdx);
    const afterCursor = value.substring(cursorIdx);
    const mentionText = `[[${novel.title}]]`;

    const newValue = beforeTrigger + mentionText + afterCursor;
    onChangeValue(newValue);

    setDropdownOpen(false);
    setSearchQuery('');
    setItems([]);

    // Restore focus and position cursor after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = triggerIdx + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Handle keyboard navigation for autocomplete dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!dropdownOpen || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectNovel(items[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDropdownOpen(false);
      setSearchQuery('');
      setItems([]);
    } else if (e.key === 'Tab') {
      // Allow user to select current index with Tab
      e.preventDefault();
      selectNovel(items[selectedIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full ${themeStyles.bg} border ${themeStyles.border} p-3 text-xs font-mono text-current focus:outline-none focus:border-[#FF3D00] ${className}`}
        rows={rows}
        disabled={disabled}
      />

      {dropdownOpen && items.length > 0 && (
        <NovelMentionDropdown
          items={items}
          selectedIndex={selectedIndex}
          onSelect={selectNovel}
          setSelectedIndex={setSelectedIndex}
          dropdownRef={dropdownRef}
        />
      )}
    </div>
  );
};
