"use client";

import { useState } from "react";
import { Camera, Keyboard, Sparkles, ShieldCheck } from "lucide-react";
import { GatekeeperEvent } from "./types";
import { GatekeeperScanner } from "./GatekeeperScanner";
import { GatekeeperManualInput } from "./GatekeeperManualInput";
import { GatekeeperResultCard, ValidationDetails } from "./GatekeeperResultCard";
import { ValidationResult, triggerGatekeeperFeedback } from "@/lib/gatekeeper-feedback";
import { useToast } from "@/components/ui/toast";

export type ValidationMode = "camera" | "manual";

interface GatekeeperTabsProps {
  event: GatekeeperEvent;
  activeMode: ValidationMode;
  onSelectMode: (mode: ValidationMode) => void;
  onValidationSuccess: () => void;
}

export function GatekeeperTabs({
  event,
  activeMode,
  onSelectMode,
  onValidationSuccess,
}: GatekeeperTabsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ status: ValidationResult; details: ValidationDetails } | null>(null);
  const { error } = useToast();

  const handleValidate = async (payload: { qrPayload?: string; ticketCode?: string }) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await fetch("/api/gate/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ...payload,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro na validação.");
      }

      const valResult = data.result as ValidationResult;
      
      triggerGatekeeperFeedback(valResult);
      
      setResult({
        status: valResult,
        details: {
          code: payload.ticketCode || data.ticket?.code || "N/A",
          participantName: data.ticket?.customerName,
          sector: data.ticket?.sectorName,
          seat: data.ticket?.seat,
          usedAt: data.usedAt,
          correctEventName: data.expectedEvent,
        }
      });

      if (valResult === "VALID") {
        onValidationSuccess();
      }

      if (activeMode === "camera") {
        setTimeout(() => {
          setResult(null);
          setIsProcessing(false);
        }, 2000);
      } else {
        setIsProcessing(false);
      }
      
    } catch (err) {
      error((err as Error).message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 bg-bg-surface p-1.5 rounded-xl shadow-sm max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => { onSelectMode("camera"); setResult(null); }}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all min-h-[48px] cursor-pointer ${
            activeMode === "camera"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
          }`}
          aria-selected={activeMode === "camera"}
          role="tab"
        >
          <Camera className="w-5 h-5 shrink-0" />
          <span>Scanner de Câmera</span>
        </button>

        <button
          type="button"
          onClick={() => { onSelectMode("manual"); setResult(null); }}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all min-h-[48px] cursor-pointer ${
            activeMode === "manual"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
          }`}
          aria-selected={activeMode === "manual"}
          role="tab"
        >
          <Keyboard className="w-5 h-5 shrink-0" />
          <span>Digitação Manual</span>
        </button>
      </div>

      <div className="bg-bg-surface shadow-sm rounded-xl p-6 sm:p-8 max-w-2xl mx-auto text-center relative overflow-hidden">
        {result && (
          <div className="mb-6">
            <GatekeeperResultCard 
              result={result.status} 
              details={result.details} 
              onClear={() => setResult(null)} 
            />
          </div>
        )}
        
        <div className={result && activeMode === "camera" ? "hidden" : "block"}>
           {activeMode === "camera" ? (
            <GatekeeperScanner
              eventId={event.id}
              onScan={(qrPayload) => handleValidate({ qrPayload })}
              onSwitchToManual={() => onSelectMode("manual")}
              isProcessing={isProcessing}
            />
          ) : (
            <GatekeeperManualInput
              onValidate={(ticketCode) => handleValidate({ ticketCode })}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {!result && activeMode === "camera" && (
           <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-text-muted">
             <div className="flex items-center gap-1.5">
               <ShieldCheck className="w-4 h-4 text-emerald-400" />
               <span>Assinatura Criptográfica HMAC</span>
             </div>
             <div className="flex items-center gap-1.5">
               <Sparkles className="w-4 h-4 text-primary" />
               <span>Anti-duplicação Concorrente</span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
