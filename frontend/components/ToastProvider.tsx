"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (kind: ToastKind, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/** Like useToast, but returns null outside the provider instead of throwing. */
export function useOptionalToast(): ToastContextValue | null {
  return useContext(ToastContext);
}

const TOAST_DURATION_MS = 4000;

const kindStyles: Record<ToastKind, { icon: LucideIcon; iconClass: string; label: string }> = {
  success: { icon: CircleCheck, iconClass: 'text-success', label: 'Success' },
  error: { icon: CircleAlert, iconClass: 'text-danger', label: 'Error' },
  info: { icon: Info, iconClass: 'text-accent', label: 'Notice' },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Math.random().toString(36).slice(2);
      const item: ToastItem = { id, kind, message };
      // Keep at most 4 on screen.
      setToasts((prev) => [...prev.slice(-3), item]);
      timers.current.set(
        id,
        setTimeout(() => removeToast(id), TOAST_DURATION_MS)
      );
    },
    [removeToast]
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
      >
        {toasts.map((t) => {
          const { icon: Icon, iconClass, label } = kindStyles[t.kind] ?? kindStyles.info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-strong bg-surface-2/95 py-3 pl-3.5 pr-2 shadow-popover backdrop-blur-xl motion-safe:animate-toast-in"
            >
              <Icon aria-hidden="true" className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${iconClass}`} strokeWidth={1.75} />
              <p className="min-w-0 flex-1 text-sm leading-6 text-fg">
                <span className="sr-only">{label}: </span>
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
