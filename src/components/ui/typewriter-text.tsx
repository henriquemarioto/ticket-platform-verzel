"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TypewriterSegment {
  prefix: string;
  highlight: string;
  highlightColor?: string;
  suffix: string;
}

export type TypewriterPhraseItem = string | TypewriterSegment;

export interface TypewriterTextProps {
  phrases: TypewriterPhraseItem[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  pauseBetweenPhrases?: number;
  className?: string;
  cursorClassName?: string;
}

type TypewriterState = "typing" | "pausing" | "deleting" | "pause-between";

function normalizePhrase(item: TypewriterPhraseItem): TypewriterSegment {
  if (typeof item === "string") {
    return { prefix: item, highlight: "", highlightColor: "", suffix: "" };
  }
  return item;
}

export function TypewriterText({
  phrases,
  typingSpeed = 70,
  deletingSpeed = 35,
  pauseDuration = 3000,
  pauseBetweenPhrases = 300,
  className,
  cursorClassName,
}: TypewriterTextProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = React.useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  const currentItem = phrases[currentPhraseIndex];
  const currentPhrase = currentItem
    ? normalizePhrase(currentItem)
    : { prefix: "", highlight: "", highlightColor: "", suffix: "" };

  const fullLength =
    currentPhrase.prefix.length +
    currentPhrase.highlight.length +
    currentPhrase.suffix.length;

  const [displayedLength, setDisplayedLength] = React.useState(() => {
    if (!phrases[0]) return 0;
    const initial = normalizePhrase(phrases[0]);
    return initial.prefix.length + initial.highlight.length + initial.suffix.length;
  });
  const [state, setState] = React.useState<TypewriterState>("pausing");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion || phrases.length === 0) {
      return;
    }

    let timeout: NodeJS.Timeout;

    if (state === "typing") {
      if (displayedLength < fullLength) {
        timeout = setTimeout(() => {
          setDisplayedLength((prev) => prev + 1);
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setState("pausing");
        }, 0);
      }
    } else if (state === "pausing") {
      timeout = setTimeout(() => {
        setState("deleting");
      }, pauseDuration);
    } else if (state === "deleting") {
      if (displayedLength > 0) {
        timeout = setTimeout(() => {
          setDisplayedLength((prev) => prev - 1);
        }, deletingSpeed);
      } else {
        timeout = setTimeout(() => {
          setState("pause-between");
        }, 0);
      }
    } else if (state === "pause-between") {
      timeout = setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        setState("typing");
      }, pauseBetweenPhrases);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [
    state,
    displayedLength,
    fullLength,
    phrases.length,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    pauseBetweenPhrases,
    prefersReducedMotion,
  ]);

  if (phrases.length === 0) {
    return null;
  }

  if (prefersReducedMotion) {
    const firstPhrase = normalizePhrase(phrases[0]);
    return (
      <span className={cn("inline text-center leading-tight", className)}>
        <span>{firstPhrase.prefix}</span>
        {firstPhrase.highlight && (
          <span className={cn(firstPhrase.highlightColor)}>
            {firstPhrase.highlight}
          </span>
        )}
        <span>{firstPhrase.suffix}</span>
      </span>
    );
  }

  const prefixPart = currentPhrase.prefix.slice(
    0,
    Math.min(displayedLength, currentPhrase.prefix.length)
  );

  const highlightPart =
    displayedLength > currentPhrase.prefix.length
      ? currentPhrase.highlight.slice(
          0,
          Math.min(
            displayedLength - currentPhrase.prefix.length,
            currentPhrase.highlight.length
          )
        )
      : "";

  const suffixPart =
    displayedLength > currentPhrase.prefix.length + currentPhrase.highlight.length
      ? currentPhrase.suffix.slice(
          0,
          displayedLength -
            currentPhrase.prefix.length -
            currentPhrase.highlight.length
        )
      : "";

  const currentFullText =
    currentPhrase.prefix + currentPhrase.highlight + currentPhrase.suffix;

  return (
    <span className={cn("inline text-center leading-tight", className)}>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {currentFullText}
      </span>
      <span aria-hidden="true" className="inline">
        <span>{prefixPart}</span>
        {highlightPart && (
          <span className={cn(currentPhrase.highlightColor)}>
            {highlightPart}
          </span>
        )}
        <span>{suffixPart}</span>
        {displayedLength === 0 && "\u200B"}
        <span
          className={cn(
            "inline-block w-[3px] sm:w-[4px] h-[0.85em] bg-primary ml-1.5 align-middle rounded-full animate-cursor-blink shadow-[0_0_8px_rgba(0,87,255,0.4)]",
            cursorClassName
          )}
        />
      </span>
    </span>
  );
}
