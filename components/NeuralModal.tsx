
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

/** 
 * NeuralModal Transition Protocols 
 */
export type ModalTransition = 'slide' | 'fade' | 'zoom' | 'fadeSlideIn';

/** 
 * NeuralModal Dimensions 
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface NeuralModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  transition?: ModalTransition;
  size?: ModalSize;
}

/** 
 * Layout Registry 
 */
const SIZE_CONFIG: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw] h-[90vh]',
};

/** 
 * Animation Registry 
 */
const TRANSITION_CONFIG: Record<ModalTransition, string> = {
  slide: 'animate-modal-slide',
  fade: 'animate-modal-fade',
  zoom: 'animate-modal-zoom',
  fadeSlideIn: 'animate-modal-fade-slide-in',
};

/**
 * NeuralModal Component
 * 
 * A high-fidelity, accessible dialogue component designed for enterprise OS environments.
 * Uses React Portals for clean rendering and strict ARIA guidelines for compliance.
 */
export const NeuralModal: React.FC<NeuralModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  transition = 'fade',
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const portalRoot = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalRoot.current = document.getElementById('modal-root');
  }, []);

  /** 
   * Focus Management: Traps focus within the modal bounds. 
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(modalRef.current.querySelectorAll(focusableElements)) as HTMLElement[];
      const focusables = elements.filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
      
      if (focusables.length === 0) return;
      
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      // Async focus shift to allow transition start
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          (firstFocusable || modalRef.current).focus();
        }
      }, 100);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, handleKeyDown]);

  const animationClass = useMemo(() => TRANSITION_CONFIG[transition], [transition]);
  const sizeClass = useMemo(() => SIZE_CONFIG[size], [size]);

  if (!isOpen || !portalRoot.current) return null;

  const ModalContent = (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 pointer-events-none"
      role="presentation"
    >
      {/* Backdrop: Cinematic veil */}
      <div 
        className="fixed inset-0 bg-black/80 animate-backdrop pointer-events-auto cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface: The primary UI shard */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative w-full ${sizeClass} bg-[#020420] border border-[#1a1e43] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto outline-none ${animationClass}`}
      >
        {/* Shard: Header */}
        <header className="flex items-center justify-between px-10 py-7 border-b border-[#1a1e43] bg-black/40 z-10">
          <h2 id="modal-title" className="text-[12px] font-black text-[#00DC82] uppercase tracking-[0.5em] leading-none">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-white/30 hover:text-[#00DC82] transition-colors p-2 rounded-xl hover:bg-white/5 outline-none focus:ring-2 focus:ring-[#00DC82]/50"
            aria-label="Close dialogue"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Shard: Body */}
        <div className="flex-1 p-10 text-[15px] font-medium text-slate-400 leading-relaxed overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Shard: Footer */}
        <footer className="px-10 py-7 border-t border-[#1a1e43] bg-black/40 flex justify-end items-center gap-4 z-10">
          {footer ? footer : (
            <button 
              onClick={onClose}
              className="px-10 py-4 bg-nuxt-gradient text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl active:scale-95 hover:brightness-110 transition-all outline-none focus:ring-2 focus:ring-[#00DC82]/50"
            >
              Confirm Selection
            </button>
          )}
        </footer>
      </div>
    </div>
  );

  return createPortal(ModalContent, portalRoot.current);
};
