import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "danger" | "neutral"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "neutral", ...props }, ref) => {
    
    const variants = {
      success: "bg-success/20 text-success border-success/30",
      warning: "bg-warning/20 text-warning border-warning/30",
      danger: "bg-danger/20 text-danger border-danger/30",
      neutral: "bg-slate-800 text-slate-300 border-slate-700",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
