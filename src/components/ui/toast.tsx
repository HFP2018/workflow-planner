import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  showToast: (props: ToastProps) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const showToast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...props, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, props.duration || 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              "animate-slide-in rounded-lg px-4 py-3 text-sm font-medium shadow-elegant max-w-sm",
              toast.type === 'success' && "bg-success text-success-foreground",
              toast.type === 'error' && "bg-destructive text-destructive-foreground",
              toast.type === 'info' && "bg-primary text-primary-foreground",
              toast.type === 'warning' && "bg-warning text-warning-foreground",
              !toast.type && "bg-primary text-primary-foreground",
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}