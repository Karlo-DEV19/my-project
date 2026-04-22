'use client';

import { X } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

type AccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  children?: React.ReactNode;
  /** Passed from Header to show contextual messages inside the form */
  context?: 'default' | 'checkout';
};

export default function AccountModal({ isOpen, onClose, triggerRef, children, context = 'default' }: AccountModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [visible, setVisible] = useState(false);
  // true while the child AccountForm has the OTP modal open;
  // backdrop click-to-close is suppressed during that window.
  const [otpActive, setOtpActive] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      // Tiny tick so initial render hits scale-95/opacity-0 first
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Full close: reset mode, return focus to trigger
  const handleClose = useCallback(() => {
    setMode('login');
    onClose();
    // Return focus to the button that opened the modal
    setTimeout(() => triggerRef?.current?.focus(), 0);
  }, [onClose, triggerRef]);

  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const el = modalRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [isOpen, mode]); // re-run when mode changes (different focusable set)

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-200 flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      // Suppress backdrop close while OTP modal is open — clicks must reach the Radix portal
      onClick={otpActive ? undefined : handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-sm mx-4 sm:max-w-md bg-background border border-border shadow-2xl rounded-lg p-6 sm:p-8 transition-all duration-200 ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close account modal"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo pic/logo.png" alt="Logo" className="h-12 w-auto object-contain mx-auto mb-4" />

          <div className="flex justify-center gap-6 border-b border-border" role="tablist" aria-label="Account mode">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              id="account-modal-title"
              className={`pb-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm ${mode === 'login' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode('login')}
            >
              LOGIN
            </button>
            <button
              role="tab"
              aria-selected={mode === 'signup'}
              className={`pb-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm ${mode === 'signup' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode('signup')}
            >
              SIGN UP
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="mt-4">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                mode,
                onModeChange: setMode,
                onClose: handleClose,
                // Lets AccountForm tell us when TwoFactorModal is open/closed
                onOtpStateChange: setOtpActive,
                // Pass checkout context so AccountForm can show a guided message
                context,
              } as any);
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
}
