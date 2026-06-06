"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export interface IllustrationItem {
  id: string;
  type: 'legacy' | 'image';
  key?: string;
  src?: string;
  alt?: string;
  caption?: string;
  element?: React.ReactNode;
}

interface IllustrationViewerProps {
  illustrations: IllustrationItem[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const IllustrationViewer: React.FC<IllustrationViewerProps> = ({
  illustrations,
  activeIndex,
  onClose,
  onNavigate,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const draggedRef = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const activeItem = illustrations[activeIndex];

  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex);
  if (activeIndex !== prevActiveIndex) {
    setPrevActiveIndex(activeIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  // Trap focus and block body scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard controls: ESC to close, Left/Right arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      } else if (e.key === 'ArrowRight' && activeIndex < illustrations.length - 1) {
        onNavigate(activeIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, illustrations.length, onClose, onNavigate]);

  if (!activeItem) return null;

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag / Pan mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    draggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;

    if (Math.abs(nextX - position.x) > 3 || Math.abs(nextY - position.y) > 3) {
      draggedRef.current = true;
    }

    setPosition({
      x: nextX,
      y: nextY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
      draggedRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1) return;
    if (e.touches.length === 1) {
      const nextX = e.touches[0].clientX - dragStart.x;
      const nextY = e.touches[0].clientY - dragStart.y;

      if (Math.abs(nextX - position.x) > 3 || Math.abs(nextY - position.y) > 3) {
        draggedRef.current = true;
      }

      setPosition({
        x: nextX,
        y: nextY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Prevent closing when clicking inner content controls
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 select-none focus:outline-none"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={handleContentClick}
      >
        <div className="text-left">
          <span className="text-[10px] font-mono text-[#FF3D00] uppercase tracking-wider block font-bold">
            Illustration {activeIndex + 1} of {illustrations.length}
          </span>
          <h3 className="text-xs sm:text-sm text-neutral-300 font-medium truncate max-w-[200px] sm:max-w-md">
            {activeItem.caption || "Light Novel Illustration"}
          </h3>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 text-white/80 hover:text-white hover:bg-neutral-800 transition-all rounded-none bg-transparent border-none cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 text-white/80 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-none bg-transparent border-none cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetZoom}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className="p-2 text-white/80 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-none bg-transparent border-none cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-neutral-800 mx-1"></div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-neutral-800 transition-all rounded-none bg-transparent border-none cursor-pointer"
            title="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden w-full">
        {/* Navigation - Prev Button */}
        {illustrations.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex > 0) onNavigate(activeIndex - 1);
            }}
            disabled={activeIndex === 0}
            className={`absolute left-4 p-3 bg-black/40 border border-neutral-800 text-white rounded-none z-10 transition-all hover:bg-neutral-800 disabled:opacity-25 disabled:hover:bg-black/40 cursor-pointer ${
              activeIndex === 0 ? 'cursor-not-allowed' : ''
            }`}
            title="Previous Illustration"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Scaled/Panned Image Canvas */}
        <div
          className={`flex items-center justify-center w-full h-full transition-transform duration-100 ${
            scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onClick={(e) => {
            if (draggedRef.current) {
              e.stopPropagation();
              draggedRef.current = false;
              return;
            }
            onClose();
          }}
        >
          <div 
            className="max-w-full max-h-[80vh] flex items-center justify-center p-4"
            onClick={handleContentClick}
          >
            {activeItem.type === 'legacy' && activeItem.element ? (
              <div className="w-full max-w-2xl text-white">
                {activeItem.element}
              </div>
            ) : activeItem.src ? (
              <Image
                src={activeItem.src}
                alt={activeItem.alt || "Illustration"}
                width={1200}
                height={800}
                unoptimized={activeItem.src.startsWith('data:')}
                className="max-w-full max-h-[80vh] object-contain w-auto h-auto"
                priority
              />
            ) : null}
          </div>
        </div>

        {/* Navigation - Next Button */}
        {illustrations.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activeIndex < illustrations.length - 1) onNavigate(activeIndex + 1);
            }}
            disabled={activeIndex === illustrations.length - 1}
            className={`absolute right-4 p-3 bg-black/40 border border-neutral-800 text-white rounded-none z-10 transition-all hover:bg-neutral-800 disabled:opacity-25 disabled:hover:bg-black/40 cursor-pointer ${
              activeIndex === illustrations.length - 1 ? 'cursor-not-allowed' : ''
            }`}
            title="Next Illustration"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Caption Overlay */}
      {activeItem.caption && (
        <div 
          className="p-6 bg-gradient-to-t from-black/80 to-transparent text-center z-10"
          onClick={handleContentClick}
        >
          <p className="text-xs sm:text-sm font-sans tracking-wide text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            {activeItem.caption}
          </p>
        </div>
      )}
    </div>
  );
};

export default IllustrationViewer;
