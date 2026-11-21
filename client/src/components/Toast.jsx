import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const MAX_TOASTS = 4;
const DURATION = { success: 4000, error: 7000 };

/** Wrap the app once; then call `const toast = useToast(); toast.success('Saved')` / `toast.error(message)`. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, type, message }]);
      setTimeout(() => dismiss(id), DURATION[type]);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`toast-in pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 bg-aisle-hi px-4 py-3 text-sm shadow-xl shadow-black/40 ${
              t.type === 'error' ? 'border-velvet' : 'border-punch'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-black ${
                t.type === 'error' ? 'bg-velvet text-white' : 'bg-punch text-plum'
              }`}
            >
              {t.type === 'error' ? '!' : '✓'}
            </span>
            <p className="flex-1 font-medium text-stock">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-mute hover:text-stock"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>');
  return toast;
}
