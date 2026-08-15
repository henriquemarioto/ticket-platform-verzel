"use client";

import { useToast } from "@/components/ui/toast";
import { Users } from "lucide-react";
import { useState } from "react";

export function QuickRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { info } = useToast();

  const switchRole = (role: string) => {
    info(`Perfil alternado para: ${role}`);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen && (
        <div className="absolute bottom-12 left-0 mb-2 flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-surface p-2 shadow-lg w-48">
          <div className="px-2 py-1 text-xs font-semibold text-text-muted">
            Alternar Perfil
          </div>
          <button onClick={() => switchRole('Organizador')} className="rounded-md px-2 py-1.5 text-sm text-left hover:bg-bg-surface-hover transition-colors">
            Organizador
          </button>
          <button onClick={() => switchRole('Cliente 1')} className="rounded-md px-2 py-1.5 text-sm text-left hover:bg-bg-surface-hover transition-colors">
            Cliente 1
          </button>
          <button onClick={() => switchRole('Cliente 2')} className="rounded-md px-2 py-1.5 text-sm text-left hover:bg-bg-surface-hover transition-colors">
            Cliente 2
          </button>
          <button onClick={() => switchRole('Portaria')} className="rounded-md px-2 py-1.5 text-sm text-left hover:bg-bg-surface-hover transition-colors">
            Portaria
          </button>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        title="Alternar Perfil"
      >
        <Users className="h-5 w-5" />
      </button>
    </div>
  );
}
