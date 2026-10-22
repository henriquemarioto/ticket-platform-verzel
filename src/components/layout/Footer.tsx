import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Coluna 1: Marca & Manifesto Editorial */}
          <div className="space-y-4">
            <BrandLogo size="md" showTagline />
            <p className="text-xs text-text-muted leading-relaxed">
              Curadoria de eventos e bilheteria de alta concorrência. Arquitetura orientada a transações ACID anti-double booking, emissão criptográfica de vouchers com HMAC-256 e sincronização de assentos em tempo real via Server-Sent Events.
            </p>
          </div>

          {/* Coluna 2: Explorar Agenda */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Explorar Agenda
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="text-text-muted hover:text-primary transition-colors">
                  Todos os Eventos
                </Link>
              </li>
              <li>
                <Link href="/events?category=SHOW" className="text-text-muted hover:text-primary transition-colors">
                  Shows & Concertos
                </Link>
              </li>
              <li>
                <Link href="/events?category=THEATER" className="text-text-muted hover:text-primary transition-colors">
                  Teatro & Espetáculos
                </Link>
              </li>
              <li>
                <Link href="/events?category=MOVIE" className="text-text-muted hover:text-primary transition-colors">
                  Cinema & Festivais
                </Link>
              </li>
              <li>
                <Link href="/events?category=FESTIVAL" className="text-text-muted hover:text-primary transition-colors">
                  Grandes Festivais
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Plataforma & Acesso */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Plataforma & Acesso
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/my-tickets" className="text-text-muted hover:text-primary transition-colors">
                  Meus Ingressos
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-text-muted hover:text-primary transition-colors">
                  Entrar na Conta
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-text-muted hover:text-primary transition-colors">
                  Criar Cadastro
                </Link>
              </li>
              <li>
                <Link href="/organizer" className="text-text-muted hover:text-primary transition-colors">
                  Painel do Organizador
                </Link>
              </li>
              <li>
                <Link href="/gatekeeper" className="text-text-muted hover:text-primary transition-colors">
                  Terminal de Portaria
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Engenharia & Segurança */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              Segurança & Concorrência
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-main text-[11px] font-mono text-text-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>HMAC-SHA256 256-BIT</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-main text-[11px] font-mono text-text-muted">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span>ACID ANTI-DOUBLE BOOKING</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-main text-[11px] font-mono text-text-muted">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span>REALTIME SSE STREAM</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-main text-[11px] font-mono text-text-muted">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>POSTGRESQL CONSTRAINTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div>
            &copy; {new Date().getFullYear()} Verzel Tickets. Plataforma de Bilheteria de Alta Disponibilidade.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>VERZEL TICKETS v2.0</span>
            <span>&bull;</span>
            <span>WCAG 2.1 AA COMPLIANT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
