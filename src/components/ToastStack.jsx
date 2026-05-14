import { useEffect, useRef } from "react";
import { X } from "lucide-react";

function ToastStack({ toasts, onRemoveToast }) {
  const timersRef = useRef({});

  useEffect(() => {
    // Clear old timers
    Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    timersRef.current = {};

    // Auto-remove each toast after 4 seconds
    toasts.forEach((toast) => {
      timersRef.current[toast.id] = setTimeout(() => {
        if (onRemoveToast) {
          onRemoveToast(toast.id);
        }
      }, 4000);
    });

    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, onRemoveToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div className="flex items-start gap-3 rounded-2xl border border-[#c7dbc0] bg-[#fffdf7]/95 p-4 text-sm shadow-[0_16px_40px_rgba(44,35,19,0.14)] backdrop-blur-xl dark:border-[#2ddfa3]/20 dark:bg-[#10241d]/95" key={toast.id}>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#17352b] dark:text-[#f7f3e8]">{toast.title}</p>
            <p className="mt-1 text-[#6f7e76] dark:text-[#a7b8b2]">{toast.message}</p>
          </div>
          <button onClick={() => onRemoveToast?.(toast.id)} className="shrink-0 text-[#a7b8b2] hover:text-[#17352b] dark:hover:text-[#f7f3e8]" aria-label="Close notification">
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastStack;
