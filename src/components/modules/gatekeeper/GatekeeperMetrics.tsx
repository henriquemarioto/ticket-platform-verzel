"use client";

import { Ticket, CheckCircle2, Users, TrendingUp } from "lucide-react";
import { GatekeeperEvent } from "./types";

interface GatekeeperMetricsProps {
  event: GatekeeperEvent;
}

export function GatekeeperMetrics({ event }: GatekeeperMetricsProps) {
  const { totalSold, totalCheckedIn } = event;
  const pendingTickets = Math.max(0, totalSold - totalCheckedIn);
  const occupancyRate = totalSold > 0 ? Math.round((totalCheckedIn / totalSold) * 100) : 0;

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Ingressos Emitidos */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-text-muted">Total Emitidos</span>
            <div className="w-8 h-8 rounded-lg bg-bg-surface-hover flex items-center justify-center text-text-primary">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {totalSold}
            </span>
            <p className="text-xs text-text-muted mt-1">Ingressos comercializados</p>
          </div>
        </div>

        {/* Entradas Validadas */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-text-muted">Validados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
              {totalCheckedIn}
            </span>
            <p className="text-xs text-text-muted mt-1">Check-ins realizados</p>
          </div>
        </div>

        {/* Entradas Pendentes */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-text-muted">Pendentes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
              {pendingTickets}
            </span>
            <p className="text-xs text-text-muted mt-1">Aguardando entrada</p>
          </div>
        </div>

        {/* Taxa de Presença / Ocupação */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-text-muted">Taxa de Presença</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {occupancyRate}%
            </span>
            <p className="text-xs text-text-muted mt-1">Comparecimento no local</p>
          </div>
        </div>
      </div>

      {/* Barra de Progresso de Ocupação */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
        <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-text-muted mb-2">
          <span>Progresso de Entrada no Evento</span>
          <span className="text-text-primary font-semibold">
            {totalCheckedIn} de {totalSold} participantes ({occupancyRate}%)
          </span>
        </div>
        <div className="w-full h-3 bg-bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
            role="progressbar"
            aria-valuenow={occupancyRate}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
}
