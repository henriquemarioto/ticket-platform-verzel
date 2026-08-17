import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-danger focus-visible:ring-danger/50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1 text-sm text-danger mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <select
          className={cn(
            "flex h-10 w-full rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger/50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && (
          <div className="flex items-center gap-1 text-sm text-danger mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger/50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-sm text-danger mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Input, Select, Textarea }
