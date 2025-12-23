
import React, { useEffect, useRef, useCallback, useMemo } from 'react';

/** Available transition protocols for the modal surface entrance */
export type ModalTransition = 'slide' | 'fade' | 'zoom' | 'fadeSlideIn';

/** Modal size configurations for varied content density */
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

/** Registry for surface dimensions mapped to Tailwind-compatible layout classes */
const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw] h-[90vh]',
};

/** 
 * Registry for motion protocols. 
 * Maps transition props to the custom animation classes defined in index.html styles.
 */
const TRANSITION_CLASSES: Record<ModalTransition, string> = {
  slide: 'animate-modal-slide',
  fade: 'animate-modal-fade',
  zoom: 'animate-modal-zoom',
  fadeSlideIn: 'animate-modal-fade-slide-in',
};

/**
 * NeuralModal: An enterprise-grade, accessible dialogue component.
 * Consolidates entrance transition logic and enforces strict focus containment.
 * 
 * Features:
 * - Centralized transition orchestration via `TRANSITION_CLASSES`.
 * - Robust WAI-ARIA focus trapping and restoration.
 * - Studio-tier aesthetics with cinematic backdrops.
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
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const transitionClass = useMemo(() => TRANSITION_CLASSES[transition] || TRANSITION_CLASSES.fade, [transition]);
  const sizeClass = useMemo(() => SIZE_CLASSES[size] || SIZE_CLASSES.md, [size]);

  /** 
   * Orchestrates focus containment within the modal boundary.
   * Ensures the user cannot 'tab' out into the background document.
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusables = Array.from(modalRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
      
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
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
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      
      // Allow the animation frame to settle before moving focus
      const focusTimer = setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          (firstFocusable || modalRef.current).focus();
        }
      }, 50);
      
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(focusTimer);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10" 
      role="presentation"
    >
      {/* Backdrop: High-fidelity cinematic veil */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl animate-backdrop cursor-pointer" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Modal Surface: The primary orchestration unit */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-header-title"
        tabIndex={-1}
        className={`relative w-full ${sizeClass} bg-[#121212] border border-[#252525] rounded-[2.5rem] shadow-2xl flex flex-col outline-none overflow-hidden gold-glow border-gold-subtle transform-gpu ${transitionClass}`}
      >
        {/* Header Shard */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-[#222] bg-black/40 z-10">
          <h2 id="modal-header-title" className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] leading-none">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="text-white/30 hover:text-[#D4AF37] transition-all p-2 rounded-xl hover:bg-white/5 outline-none focus:ring-2 focus:ring-[#D4AF37]/50" 
            aria-label="Dismiss dialogue"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Body Shard */}
        <div className="flex-1 px-10 py-10 text-[14px] font-medium text-[#c0c0c0] leading-relaxed overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer Shard */}
        <footer className="px-8 py-6 border-t border-[#222] bg-black/40 flex justify-end items-center gap-4 z-10">
          {footer ? footer : (
            <button 
              onClick={onClose} 
              className="px-8 py-3 bg-gold-gradient text-black text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 hover:brightness-110 transition-all outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              Continue
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
