"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✅", error: "❌", info: "ℹ️",
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: "bg-candy-green/90", error: "bg-candy-red/90", info: "bg-candy-blue/90",
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "pointer-events-auto px-4 py-3 rounded-card shadow-elevated text-white font-medium text-sm flex items-center gap-2",
                TOAST_COLORS[t.type]
              )}
            >
              <span>{TOAST_ICONS[t.type]}</span>
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
