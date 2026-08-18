"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.body.style.overflow = "unset"
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-[100] w-full max-w-lg rounded-xl shadow-xl ring-1 ring-black/5 bg-bg-surface flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className={cn("flex items-center shrink-0 p-6", title ? "justify-between pb-4 shadow-sm" : "justify-end pb-2")}>
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ml-auto cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative p-6 pt-4 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
