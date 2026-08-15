"use client";

import Link from "next/link";
import { Ticket, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type UserPayload = {
  id: string;
  email: string;
  role: string;
};

export function Navbar({ user }: { user: UserPayload | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        success("Sessão encerrada com sucesso.");
        router.push('/');
        router.refresh();
      } else {
        error("Erro ao encerrar sessão.");
      }
    } catch (err) {
      error("Erro ao encerrar sessão.");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-main/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Verzel Tickets</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Eventos</Link>
          <Link href="/my-tickets" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Meus Ingressos</Link>
          <div className="flex items-center gap-3 ml-4">
            {user ? (
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary">Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-text-muted hover:text-text-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-border-subtle bg-bg-surface p-4">
          <nav className="flex flex-col gap-4">
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary" onClick={() => setIsOpen(false)}>Eventos</Link>
            <Link href="/my-tickets" className="text-sm font-medium text-text-muted hover:text-text-primary" onClick={() => setIsOpen(false)}>Meus Ingressos</Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
              {user ? (
                <Button variant="ghost" onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full justify-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-center">Entrar</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" className="w-full justify-center">Criar Conta</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
