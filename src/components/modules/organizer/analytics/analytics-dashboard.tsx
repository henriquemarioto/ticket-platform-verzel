"use client";

import React, { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  DollarSign,
  Ticket,
  Users,
  CheckCircle2,
  Download,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  AlertCircle,
  Inbox,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EventOption {
  id: string;
  title: string;
}

interface AnalyticsSummary {
  totalRevenue: number;
  totalTicketsSold: number;
  totalCapacity: number;
  occupancyRate: number;
  checkedInCount: number;
  checkInRate: number;
  averageTicketPrice: number;
}

interface SectorMetric {
  sectorName: string;
  capacity: number;
  sold: number;
  available: number;
  revenue: number;
  occupancyRate: number;
}

interface SalesTimelineItem {
  date: string;
  formattedDate: string;
  amount: number;
  tickets: number;
}

interface AttendanceItem {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsResponse {
  events: EventOption[];
  summary: AnalyticsSummary;
  sectors: SectorMetric[];
  salesTimeline: SalesTimelineItem[];
  attendanceDistribution: AttendanceItem[];
}

const emptySubscribe = () => () => {};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

export function AnalyticsDashboard() {
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    fetch(
      `/api/organizer/analytics?eventId=${encodeURIComponent(selectedEventId)}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || "Não foi possível carregar os dados de analytics."
          );
        }
        return res.json();
      })
      .then((json: AnalyticsResponse) => {
        if (!ignore) {
          setData(json);
          setError(null);
          setLoading(false);
          setRefreshing(false);
        }
      })
      .catch((err: unknown) => {
        if (
          !ignore &&
          !(err instanceof DOMException && err.name === "AbortError")
        ) {
          const message =
            err instanceof Error
              ? err.message
              : "Erro inesperado ao buscar analytics.";
          setError(message);
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedEventId, reloadKey]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setLoading(true);
  };

  const sectors = data?.sectors;
  const sortedSectors = useMemo(() => {
    if (!sectors) return [];
    return [...sectors].sort((a, b) => b.revenue - a.revenue);
  }, [sectors]);

  const downloadCSV = () => {
    if (!data) return;

    const eventTitle =
      selectedEventId === "all"
        ? "Todos os Eventos"
        : data.events.find((e) => e.id === selectedEventId)?.title ||
          selectedEventId;

    const sectorSection =
      selectedEventId === "all"
        ? [
            `DETALHAMENTO POR SETOR`,
            `Disponível ao selecionar um evento específico`,
            ``,
          ]
        : [
            `DETALHAMENTO POR SETOR`,
            `Setor,Capacidade,Vendidos,Disponíveis,Taxa de Ocupação (%),Receita (R$)`,
            ...sortedSectors.map(
              (s) =>
                `"${s.sectorName}",${s.capacity},${s.sold},${s.available},"${s.occupancyRate}%","${formatCurrency(s.revenue)}"`
            ),
            ``,
          ];

    const lines: string[] = [
      `RELATÓRIO ANALÍTICO - VERZEL TICKETS`,
      `Evento: "${eventTitle}"`,
      `Data da Exportação: "${new Date().toLocaleString("pt-BR")}"`,
      ``,
      `RESUMO EXECUTIVO`,
      `Métrica,Valor`,
      `Receita Bruta Total,"${formatCurrency(data.summary.totalRevenue)}"`,
      `Total de Ingressos Vendidos,${data.summary.totalTicketsSold}`,
      `Capacidade Total,${data.summary.totalCapacity}`,
      `Taxa de Ocupação,"${data.summary.occupancyRate}%"`,
      `Presença na Portaria (Check-ins),${data.summary.checkedInCount}`,
      `Taxa de Comparecimento,"${data.summary.checkInRate}%"`,
      `Ticket Médio,"${formatCurrency(data.summary.averageTicketPrice)}"`,
      ``,
      ...sectorSection,
      `HISTÓRICO DE VENDAS (ÚLTIMOS 7 DIAS)`,
      `Data,Ingressos Vendidos,Receita (R$)`,
      ...data.salesTimeline.map(
        (t) => `"${t.date}",${t.tickets},"${formatCurrency(t.amount)}"`
      ),
    ];

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics_${selectedEventId}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Se estiver carregando pela primeira vez (sem dados)
  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        <Skeleton className="h-12 w-full sm:w-72" />

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-bg-surface p-6 rounded-xl shadow-sm border border-border-subtle space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>

        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Se ocorreu erro e não há dados carregados
  if (error && !data) {
    return (
      <div className="text-center py-16 bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          Erro ao carregar dados analíticos
        </h2>
        <p className="text-text-muted max-w-md mx-auto">{error}</p>
        <Button onClick={handleManualRefresh} variant="primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Estado vazio quando não houver eventos cadastrados
  if (data && data.events.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-text-muted mt-1">
            Visão consolidada de desempenho e portaria dos seus eventos.
          </p>
        </div>

        <div className="text-center py-16 bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            Nenhum evento encontrado
          </h2>
          <p className="text-text-muted max-w-md mx-auto">
            Você ainda não possui eventos cadastrados para visualizar métricas e
            relatórios.
          </p>
          <Link href="/organizer/events/create">
            <Button variant="primary">Criar Primeiro Evento</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { summary, salesTimeline, attendanceDistribution, events } =
    data || {
      summary: {
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalCapacity: 0,
        occupancyRate: 0,
        checkedInCount: 0,
        checkInRate: 0,
        averageTicketPrice: 0,
      },
      sectors: [],
      salesTimeline: [],
      attendanceDistribution: [],
      events: [],
    };

  const isSingleEventSelected = selectedEventId !== "all";
  const hasSales = summary.totalTicketsSold > 0;

  return (
    <div className="space-y-8">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-text-muted mt-1">
            Métricas consolidadas de vendas, ocupação e controle de acesso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Atualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSV}
            disabled={!data || data.events.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Error alert if soft refresh failed */}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Event Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-bg-surface p-4 rounded-xl border border-border-subtle shadow-xs">
        <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Filtrar por Evento:</span>
        </div>
        <div className="w-full sm:w-80">
          <Select
            value={selectedEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
            disabled={loading || refreshing}
          >
            <option value="all">Todos os Meus Eventos ({events.length})</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Bruta Total */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle flex flex-col justify-between transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Receita Bruta Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {formatCurrency(summary.totalRevenue)}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant={summary.totalRevenue > 0 ? "success" : "neutral"}>
                {summary.totalRevenue > 0 ? "Faturamento Ativo" : "Sem Receita"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Total de Ingressos Vendidos */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle flex flex-col justify-between transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Ingressos Vendidos
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {formatNumber(summary.totalTicketsSold)}{" "}
              <span className="text-sm font-normal text-text-muted">
                / {formatNumber(summary.totalCapacity)}
              </span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Taxa de ocupação:{" "}
              <strong className="text-text-primary">
                {summary.occupancyRate.toFixed(1)}%
              </strong>
            </p>
          </div>
        </div>

        {/* Presença na Portaria */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle flex flex-col justify-between transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Presença na Portaria
            </span>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {formatNumber(summary.checkedInCount)}{" "}
              <span className="text-sm font-normal text-text-muted">
                check-ins
              </span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Comparecimento:{" "}
              <strong className="text-text-primary">
                {summary.checkInRate.toFixed(1)}% dos compradores
              </strong>
            </p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle flex flex-col justify-between transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {formatCurrency(summary.averageTicketPrice)}
            </p>
            <p className="mt-1 text-xs text-text-muted">Por ingresso vendido</p>
          </div>
        </div>
      </div>

      {/* Gráficos Recharts - Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. AreaChart: Evolução de Vendas no Tempo */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Evolução de Vendas
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Receita diária dos últimos 7 dias
              </p>
            </div>
          </div>

          {!hasSales && salesTimeline.every((t) => t.amount === 0) ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-subtle rounded-lg">
              <TrendingUp className="w-8 h-8 text-text-muted/40 mb-2" />
              <p className="text-sm font-medium text-text-muted">
                Aguardando as primeiras vendas deste evento.
              </p>
            </div>
          ) : isMounted ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTimeline}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="salesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0057ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0057ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 12, fill: "#434656" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#434656" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `R$${(val / 1000).toFixed(0)}k` : `R$${val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as SalesTimelineItem;
                        return (
                          <div className="bg-bg-surface p-3 rounded-lg shadow-lg border border-border-subtle text-xs space-y-1">
                            <p className="font-semibold text-text-primary">
                              {item.formattedDate} ({item.date})
                            </p>
                            <div className="pt-1 border-t border-border-subtle space-y-1">
                              <p className="text-primary font-medium flex items-center justify-between gap-4">
                                <span>Receita:</span>
                                <span>{formatCurrency(item.amount)}</span>
                              </p>
                              <p className="text-text-muted flex items-center justify-between gap-4">
                                <span>Ingressos:</span>
                                <span className="font-semibold text-text-primary">
                                  {item.tickets} un.
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0057ff"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full animate-pulse bg-bg-main rounded-lg" />
          )}
        </div>

        {/* 2. PieChart: Donut de Distribuição de Portaria & Ocupação */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Presença e Ocupação
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Proporção entre check-ins realizados, ingressos e vagas livres
              </p>
            </div>
          </div>

          {summary.totalCapacity === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-subtle rounded-lg">
              <Users className="w-8 h-8 text-text-muted/40 mb-2" />
              <p className="text-sm font-medium text-text-muted">
                Nenhum setor cadastrado neste evento.
              </p>
            </div>
          ) : isMounted ? (
            <div className="h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const val = Number(item.value) || 0;
                        const pct =
                          summary.totalCapacity > 0
                            ? ((val / summary.totalCapacity) * 100).toFixed(1)
                            : "0";
                        return (
                          <div className="bg-bg-surface p-2.5 rounded-lg shadow-lg border border-border-subtle text-xs">
                            <p className="font-semibold text-text-primary">
                              {item.name}
                            </p>
                            <p className="text-text-muted mt-0.5">
                              {formatNumber(val)} vagas ({pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-text-muted font-medium">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full animate-pulse bg-bg-main rounded-lg" />
          )}
        </div>
      </div>

      {/* Gráficos Recharts - Linha 2 */}
      <div className="grid grid-cols-1 gap-8">
        {/* 3. BarChart: Ocupação por Setor */}
        <div className="bg-bg-surface p-6 rounded-xl shadow-xs border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Vendas por Setor
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Comparativo de capacidade total vs ingressos vendidos por setor
              </p>
            </div>
          </div>

          {!isSingleEventSelected ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-subtle rounded-lg">
              <BarChart3 className="w-8 h-8 text-text-muted/40 mb-2" />
              <p className="text-sm font-medium text-text-muted max-w-md">
                Selecione um evento específico no filtro acima para visualizar o comparativo e o detalhamento por setor.
              </p>
            </div>
          ) : sortedSectors.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-subtle rounded-lg">
              <Inbox className="w-8 h-8 text-text-muted/40 mb-2" />
              <p className="text-sm font-medium text-text-muted">
                Nenhum setor disponível para análise.
              </p>
            </div>
          ) : isMounted ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedSectors}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="sectorName"
                    tick={{ fontSize: 12, fill: "#434656" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#434656" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const sector = payload[0].payload as SectorMetric;
                        return (
                          <div className="bg-bg-surface p-3 rounded-lg shadow-lg border border-border-subtle text-xs space-y-1.5 min-w-44">
                            <p className="font-bold text-text-primary">
                              {sector.sectorName}
                            </p>
                            <div className="space-y-1 pt-1 border-t border-border-subtle">
                              <p className="text-text-muted flex justify-between gap-4">
                                <span>Capacidade:</span>
                                <span className="font-semibold text-text-primary">
                                  {formatNumber(sector.capacity)}
                                </span>
                              </p>
                              <p className="text-primary font-medium flex justify-between gap-4">
                                <span>Vendidos:</span>
                                <span>
                                  {formatNumber(sector.sold)} (
                                  {sector.occupancyRate.toFixed(1)}%)
                                </span>
                              </p>
                              <p className="text-text-muted flex justify-between gap-4">
                                <span>Disponíveis:</span>
                                <span className="font-semibold text-text-primary">
                                  {formatNumber(sector.available)}
                                </span>
                              </p>
                              <p className="text-success font-semibold flex justify-between gap-4 pt-1 border-t border-border-subtle">
                                <span>Receita:</span>
                                <span>{formatCurrency(sector.revenue)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-text-muted font-medium">
                        {value}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="capacity"
                    name="Capacidade Total"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="sold"
                    name="Ingressos Vendidos"
                    fill="#0057ff"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 w-full animate-pulse bg-bg-main rounded-lg" />
          )}
        </div>
      </div>

      {/* 4. Tabela de Detalhamento de Setores */}
      <div className="bg-bg-surface rounded-xl shadow-xs border border-border-subtle overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Detalhamento de Setores e Faturamento
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Valores consolidados por área do evento
            </p>
          </div>
          {isSingleEventSelected && (
            <Badge variant="neutral">
              {sortedSectors.length}{" "}
              {sortedSectors.length === 1 ? "Setor" : "Setores"}
            </Badge>
          )}
        </div>

        {!isSingleEventSelected ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <Inbox className="w-8 h-8 text-text-muted/40 mb-2" />
            <p className="text-sm font-medium text-text-muted max-w-md">
              Selecione um evento específico no filtro acima para visualizar o comparativo e o detalhamento por setor.
            </p>
          </div>
        ) : sortedSectors.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            Nenhum setor registrado para este evento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-main border-b border-border-subtle text-text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Setor</th>
                  <th className="px-6 py-3.5 font-semibold">Capacidade</th>
                  <th className="px-6 py-3.5 font-semibold">Vendidos</th>
                  <th className="px-6 py-3.5 font-semibold">Disponíveis</th>
                  <th className="px-6 py-3.5 font-semibold">Ocupação</th>
                  <th className="px-6 py-3.5 font-semibold text-right">
                    Receita Gerada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sortedSectors.map((sector) => (
                  <tr
                    key={sector.sectorName}
                    className="hover:bg-bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {sector.sectorName}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {formatNumber(sector.capacity)}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {formatNumber(sector.sold)}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {formatNumber(sector.available)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 w-40">
                        <div className="flex-1 h-2 bg-bg-main rounded-full overflow-hidden border border-border-subtle">
                          <div
                            className={`h-full transition-all ${
                              sector.occupancyRate >= 90
                                ? "bg-danger"
                                : sector.occupancyRate >= 60
                                  ? "bg-warning"
                                  : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, sector.occupancyRate)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
                          {sector.occupancyRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-text-primary">
                      {formatCurrency(sector.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
