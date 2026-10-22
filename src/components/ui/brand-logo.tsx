import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showTagline = false,
  className,
}: BrandLogoProps) {
  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10 sm:w-11 sm:h-11",
  };

  const wordmarkSizes = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-2xl sm:text-3xl tracking-tight",
  };

  const tagSizes = {
    sm: "text-[9px] px-1 py-0.2",
    md: "text-[10px] px-1.5 py-0.5",
    lg: "text-xs px-2 py-0.5",
  };

  return (
    <div className={cn("inline-flex flex-col select-none", className)}>
      <div className="inline-flex items-center gap-2.5">
        {/* Emblema Vetorial SVG Autoral */}
        <div
          className={cn(
            "relative shrink-0 flex items-center justify-center rounded-lg shadow-xs",
            iconDimensions[size]
          )}
        >
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-xs"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="vl-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0057ff" />
                <stop offset="100%" stopColor="#0043c8" />
              </linearGradient>
            </defs>

            {/* Bilhete Base com Recortes (Notches) Semicirculares Laterais */}
            <path
              d="M 6 4 
                 C 4.895 4 4 4.895 4 6 
                 L 4 16 
                 A 4 4 0 0 0 4 24 
                 L 4 34 
                 C 4 35.105 4.895 36 6 36 
                 L 34 36 
                 C 35.105 36 36 35.105 36 34 
                 L 36 24 
                 A 4 4 0 0 0 36 16 
                 L 36 6 
                 C 36 4.895 35.105 4 34 4 
                 Z"
              fill="url(#vl-grad)"
            />

            {/* Linha Tracejada de Perfuração / Picote Vertical */}
            <line
              x1="27"
              y1="5"
              x2="27"
              y2="35"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="2.5 2"
              strokeOpacity="0.4"
            />

            {/* Ponto / Indicador Óptico no Canhoto */}
            <circle cx="31.5" cy="20" r="1.5" fill="#ffffff" fillOpacity="0.6" />

            {/* Monograma Arquitetônico 'V' Geométrico com Corte Angular */}
            <path
              d="M 10 11 
                 L 14.5 24.5 
                 C 14.8 25.4 16.2 25.4 16.5 24.5 
                 L 21 11 
                 L 17.5 11 
                 L 15.5 18.5 
                 L 13.5 11 
                 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* Wordmark Tipográfico & Selo Monoespaçado */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-extrabold text-text-primary uppercase tracking-tight leading-none",
              wordmarkSizes[size]
            )}
          >
            Verzel
          </span>
          <span
            className={cn(
              "font-mono uppercase font-bold tracking-[0.2em] rounded bg-primary/10 text-primary border border-primary/25 leading-none",
              tagSizes[size]
            )}
          >
            TICKETS
          </span>
        </div>
      </div>

      {showTagline && (
        <span className="text-[11px] font-mono tracking-wider text-text-muted mt-1 uppercase">
          Bilheteria Oficial &bull; Alta Concorrência
        </span>
      )}
    </div>
  );
}
