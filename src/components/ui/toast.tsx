"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const addToast = React.useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const contextValue = React.useMemo(() => ({
    toast: addToast,
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    warning: (msg: string) => addToast("warning", msg),
    info: (msg: string) => addToast("info", msg),
  }), [addToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex max-h-screen w-full flex-col p-4 md:max-w-[440px] pointer-events-none gap-2.5">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-6 w-6 text-white shrink-0" />,
    error: <XCircle className="h-6 w-6 text-white shrink-0" />,
    warning: <AlertTriangle className="h-6 w-6 text-white shrink-0" />,
    info: <Info className="h-6 w-6 text-white shrink-0" />,
  };

  const variants = {
    success: "bg-emerald-600 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/30",
    error: "bg-rose-600 text-white shadow-xl shadow-rose-950/20 border border-rose-500/30",
    warning: "bg-amber-500 text-white shadow-xl shadow-amber-950/20 border border-amber-400/30",
    info: "bg-blue-600 text-white shadow-xl shadow-blue-950/20 border border-blue-500/30",
  };

  return (
    <div 
      className={cn(
        "animate-in slide-in-from-top-4 fade-in-0 duration-300 pointer-events-auto p-4 sm:p-5 rounded-xl flex items-center justify-between gap-3 w-full transition-all",
        variants[toast.type]
      )}
    >
      <div className="flex gap-3 items-center flex-1 min-w-0">
        {icons[toast.type]}
        <p className="text-sm sm:text-base font-semibold text-white leading-snug break-words">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar notificação"
        className="text-white/80 hover:text-white hover:bg-white/10 rounded-md p-1 transition-colors cursor-pointer shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
