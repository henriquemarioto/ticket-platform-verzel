import { CheckCircle2, AlertTriangle, AlertOctagon, XCircle } from "lucide-react";
import { ValidationResult } from "@/lib/gatekeeper-feedback";
import { Badge } from "@/components/ui/badge";

export interface ValidationDetails {
  code: string;
  ticketId?: string;
  participantName?: string;
  sector?: string;
  seat?: string;
  usedAt?: string; 
  correctEventName?: string;
}

interface GatekeeperResultCardProps {
  result: ValidationResult;
  details: ValidationDetails;
  onClear: () => void;
}

export function GatekeeperResultCard({ result, details, onClear }: GatekeeperResultCardProps) {
  let bgColor = "bg-bg-surface border-border-subtle";
  let icon = null;
  let title = "";

  if (result === "VALID") {
    bgColor = "bg-emerald-500/10 border-emerald-500/50";
    icon = <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />;
    title = "ACESSO LIBERADO";
  } else if (result === "ALREADY_USED") {
    bgColor = "bg-orange-500/10 border-orange-500/50";
    icon = <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto" />;
    title = "INGRESSO JÁ UTILIZADO";
  } else if (result === "WRONG_EVENT") {
    bgColor = "bg-red-500/10 border-red-500/50";
    icon = <AlertOctagon className="w-12 h-12 text-red-500 mx-auto" />;
    title = "EVENTO INCORRETO";
  } else if (result === "INVALID_CODE") {
    bgColor = "bg-rose-900/20 border-rose-900/50";
    icon = <XCircle className="w-12 h-12 text-rose-600 mx-auto" />;
    title = "CÓDIGO INVÁLIDO";
  }

  return (
    <div className={`p-6 rounded-xl border-2 text-center space-y-4 animate-in fade-in zoom-in duration-300 ${bgColor}`}>
      {icon}
      <h3 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h3>
      
      <div className="space-y-2">
        <p className="font-mono text-lg bg-bg-surface/50 py-1 px-3 rounded inline-block text-text-primary">
          {details.code}
        </p>

        {result === "VALID" && (
          <div className="space-y-1 mt-2 text-text-muted">
            {details.participantName && <p className="font-medium text-text-primary">{details.participantName}</p>}
            <div className="flex items-center justify-center gap-2">
              {details.sector && <Badge variant="success">Setor: {details.sector}</Badge>}
              {details.seat && <Badge variant="neutral">Assento: {details.seat}</Badge>}
            </div>
          </div>
        )}

        {result === "ALREADY_USED" && details.usedAt && (
          <p className="text-orange-400 mt-2">
            Primeiro check-in: <strong>{new Date(details.usedAt).toLocaleString()}</strong>
          </p>
        )}

        {result === "WRONG_EVENT" && details.correctEventName && (
          <p className="text-red-400 mt-2">
            Pertence ao evento: <strong>{details.correctEventName}</strong>
          </p>
        )}

        {result === "INVALID_CODE" && (
          <p className="text-rose-500 mt-2">O código não existe ou a assinatura HMAC é forjada.</p>
        )}
      </div>
    </div>
  );
}
