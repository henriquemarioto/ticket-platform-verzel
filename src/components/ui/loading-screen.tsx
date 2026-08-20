import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingScreenProps {
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  className,
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn(
        "flex flex-col items-center justify-center",
        fullScreen ? "min-h-[calc(100vh-160px)] w-full" : "w-full py-12",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 rounded-full bg-primary/10 animate-pulse" />
        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
