"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ShieldCheck, UserCheck, TicketCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useToast } from "@/components/ui/toast";

type UserPayload = {
  id: string;
  email: string;
  role: string;
};

export function Navbar({ user }: { user: UserPayload | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { success, error } = useToast();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        success("Sessão encerrada com sucesso.");
        router.push("/");
        router.refresh();
      } else {
        error("Erro ao encerrar sessão.");
      }
    } catch {
      error("Erro ao encerrar sessão.");
    }
  };

  const isGatekeeper = user?.role === "GATEKEEPER";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ORGANIZER":
        return { label: "Organizador", icon: ShieldCheck, color: "text-purple-600 bg-purple-50 border-purple-200" };
      case "GATEKEEPER":
        return { label: "Portaria", icon: TicketCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      default:
        return { label: "Cliente", icon: UserCheck, color: "text-blue-600 bg-blue-50 border-blue-200" };
    }
  };

  const isLinkActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-surface/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={isGatekeeper ? "/gatekeeper" : "/"}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <BrandLogo size="sm" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {!isGatekeeper && (
            <Link
              href="/"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                isLinkActive("/") && pathname === "/"
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
              }`}
            >
              Eventos
            </Link>
          )}

          {user && user.role === "CUSTOMER" && (
            <Link
              href="/my-tickets"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                isLinkActive("/my-tickets")
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
              }`}
            >
              Meus Ingressos
            </Link>
          )}

          {isGatekeeper && (
            <Link
              href="/gatekeeper"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                isLinkActive("/gatekeeper")
                  ? "text-primary bg-primary/10"
                  : "text-text-muted hover:text-primary hover:bg-bg-surface-hover"
              }`}
            >
              Portaria
            </Link>
          )}

          {user && user.role === "ORGANIZER" && (
            <>
              <Link
                href="/organizer"
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  pathname === "/organizer"
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
                }`}
              >
                Meus Eventos
              </Link>
              <Link
                href="/organizer/analytics"
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  isLinkActive("/organizer/analytics")
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
                }`}
              >
                Analytics
              </Link>
            </>
          )}

          {/* Credencial do Usuário Logado */}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border-subtle">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full border bg-bg-surface-hover/80 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {(() => {
                    const badge = getRoleBadge(user.role);
                    return (
                      <>
                        <span className="font-semibold text-text-primary">{badge.label}</span>
                        <span className="text-text-muted text-[11px] max-w-[130px] truncate" title={user.email}>
                          {user.email}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-text-muted hover:text-danger">
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Criar Conta</Button>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-text-muted hover:text-text-primary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-b border-border-subtle bg-bg-surface p-4 shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-2">
            {user && (
              <div className="mb-2 p-2.5 rounded-lg bg-bg-main border border-border-subtle text-xs flex items-center justify-between">
                <span className="font-medium text-text-muted truncate max-w-[180px]">{user.email}</span>
                <span className="font-bold text-primary">{getRoleBadge(user.role).label}</span>
              </div>
            )}
            {!isGatekeeper && (
              <Link
                href="/"
                className={`text-sm px-3 py-2 rounded-lg font-medium ${
                  pathname === "/" ? "bg-primary/10 text-primary font-bold" : "text-text-muted hover:text-text-primary"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Eventos
              </Link>
            )}
            {user && user.role === "CUSTOMER" && (
              <Link
                href="/my-tickets"
                className={`text-sm px-3 py-2 rounded-lg font-medium ${
                  isLinkActive("/my-tickets") ? "bg-primary/10 text-primary font-bold" : "text-text-muted hover:text-text-primary"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Meus Ingressos
              </Link>
            )}
            {isGatekeeper && (
              <Link
                href="/gatekeeper"
                className="text-sm px-3 py-2 rounded-lg text-primary font-bold bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                Portaria
              </Link>
            )}
            {user && user.role === "ORGANIZER" && (
              <>
                <Link
                  href="/organizer"
                  className="text-sm px-3 py-2 rounded-lg text-text-muted hover:text-text-primary font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Meus Eventos
                </Link>
                <Link
                  href="/organizer/analytics"
                  className="text-sm px-3 py-2 rounded-lg text-text-muted hover:text-text-primary font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Analytics
                </Link>
              </>
            )}
            <div className="pt-3 border-t border-border-subtle mt-2 flex flex-col gap-2">
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center gap-2 text-danger hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">Entrar</Button>
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
