import React, { useEffect, useState, useRef } from 'react';
import { X, AlertCircle, Bell, ShieldAlert } from 'lucide-react';
import { notificationRepository } from '../../repositories';
import { Notification } from '../../types';
import { useReaderStore } from '../../features/reader/store/readerStore';
import { getThemeStyles } from '../../features/reader/utils/theme';

export const NotificationModal: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const readerSettings = useReaderStore((state) => state.readerSettings);
  const themeStyles = getThemeStyles(readerSettings.theme);

  // Set mounted true on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for active notifications after mount
  useEffect(() => {
    if (!mounted) return;
    const list = notificationRepository.getAll();
    const today = new Date().toISOString().split('T')[0];
    const active = list.find((n) => {
      const isPublished = n.status === 'published';
      const isStarted = n.startDate <= today;
      const isNotEnded = n.endDate >= today;
      const isDismissed = sessionStorage.getItem(`notification_dismissed_${n.id}_${n.updatedAt}`) === 'true';
      return isPublished && isStarted && isNotEnded && !isDismissed;
    });
    setActiveNotification(active || null);
  }, [mounted]);

  const handleClose = () => {
    if (activeNotification) {
      sessionStorage.setItem(`notification_dismissed_${activeNotification.id}_${activeNotification.updatedAt}`, 'true');
      setActiveNotification(null);
    }
  };

  // Scroll Lock & Focus Trap
  useEffect(() => {
    if (!activeNotification) return;

    document.body.style.overflow = 'hidden';

    const modalEl = modalRef.current;
    if (!modalEl) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalEl.querySelectorAll(focusableSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeNotification]);

  // Auto Close Timer
  useEffect(() => {
    if (!activeNotification || !activeNotification.autoClose) return;
    const seconds = activeNotification.autoCloseSeconds || 10;
    const timer = setTimeout(() => {
      handleClose();
    }, seconds * 1000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  if (!mounted || !activeNotification) return null;

  // Render modal priority colors
  let priorityColorClass = 'text-blue-400';
  let priorityIcon = <Bell className="w-5 h-5 flex-shrink-0" />;
  if (activeNotification.priority === 'high') {
    priorityColorClass = 'text-[#FF3D00]';
    priorityIcon = <ShieldAlert className="w-5 h-5 flex-shrink-0" />;
  } else if (activeNotification.priority === 'medium') {
    priorityColorClass = 'text-amber-400';
    priorityIcon = <AlertCircle className="w-5 h-5 flex-shrink-0" />;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
      aria-describedby="notification-modal-content"
    >
      <div 
        ref={modalRef}
        className={`w-full max-w-md ${themeStyles.cardBg} border ${themeStyles.border} p-6 sm:p-8 space-y-6 relative text-current shadow-2xl focus:outline-none`}
        tabIndex={-1}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-4 right-4 ${themeStyles.accentText} hover:text-[#FF3D00] transition-colors bg-transparent border-none cursor-pointer p-1`}
          aria-label="Close Notification"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`flex items-center gap-2.5 ${priorityColorClass}`}>
          {priorityIcon}
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            {activeNotification.priority} Announcement
          </span>
        </div>

        <div className="space-y-3">
          <h3 
            id="notification-modal-title"
            className="text-lg sm:text-xl font-black uppercase tracking-tight text-current leading-snug font-bold"
          >
            {activeNotification.title}
          </h3>
          <p 
            id="notification-modal-content"
            className="text-xs sm:text-sm text-current/80 leading-relaxed whitespace-pre-line font-sans"
          >
            {activeNotification.content}
          </p>
        </div>

        <div className={`pt-4 flex justify-between items-center text-[10px] font-mono ${themeStyles.accentText} border-t ${themeStyles.border}`}>
          <span>
            {activeNotification.autoClose ? `Auto-closing in ${activeNotification.autoCloseSeconds}s...` : 'Notice Board'}
          </span>
          <button
            onClick={handleClose}
            className="bg-[#FF3D00] text-[#0A0A0A] hover:bg-white font-bold py-2 px-5 uppercase transition-colors cursor-pointer border-none font-mono text-xs"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

