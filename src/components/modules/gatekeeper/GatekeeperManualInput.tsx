"use client";

import { useState, useRef, useEffect } from "react";
import { Keyboard, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GatekeeperManualInputProps {
  onValidate: (code: string) => void;
  isProcessing: boolean;
}

export function GatekeeperManualInput({ onValidate, isProcessing }: GatekeeperManualInputProps) {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isProcessing) return;
    onValidate(code.trim().toUpperCase());
    setCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const quickCodes = [
    { label: "Válido", code: "ELT-4819", color: "text-emerald-400 bg-emerald-400/10 shadow-sm ring-1 ring-emerald-400/20" },
    { label: "Usado", code: "ELT-4820", color: "text-orange-400 bg-orange-400/10 shadow-sm ring-1 ring-orange-400/20" },
    { label: "Outro Evento", code: "RCK-9921", color: "text-red-400 bg-red-400/10 shadow-sm ring-1 ring-red-400/20" },
    { label: "Inválido", code: "XXX-0000", color: "text-rose-600 bg-rose-600/10 shadow-sm ring-1 ring-rose-600/20" },
  ];

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="ticket-code" className="text-sm font-medium text-text-muted text-left">
            Código do Ingresso
          </label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="ticket-code"
              type="text"
              placeholder="Ex: ELT-4819"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              className="text-lg font-mono tracking-widest uppercase h-12"
              icon={<Keyboard className="w-5 h-5" />}
              disabled={isProcessing}
            />
            <Button
              type="submit"
              disabled={!code.trim() || isProcessing}
              loading={isProcessing}
              className="h-12 px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </form>

      <div className="shadow-sm pt-6">
        <p className="text-sm text-text-muted mb-4 text-center">Códigos para Teste Rápido</p>
        <div className="grid grid-cols-2 gap-3">
          {quickCodes.map((tc) => (
            <button
              key={tc.code}
              type="button"
              onClick={() => {
                setCode(tc.code);
                inputRef.current?.focus();
              }}
              className={`py-2 px-3 rounded-lg border text-sm font-mono transition-colors hover:brightness-110 cursor-pointer ${tc.color}`}
            >
              <span className="block text-xs font-sans opacity-80 mb-0.5">{tc.label}</span>
              {tc.code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
