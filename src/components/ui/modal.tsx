"use client"

import * as React from "react"
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          "relative z-50 w-full max-w-lg rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ml-auto cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  )
}
