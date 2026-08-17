"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Aplicação encontrou um erro:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-danger/10 p-4 rounded-full mb-6">
        <AlertTriangle className="w-12 h-12 text-danger" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">Ops, algo deu errado</h1>
      <p className="text-text-muted mb-8 max-w-md">
        Ocorreu um erro inesperado ao carregar esta página. Nossa equipe técnica já foi notificada.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Voltar ao Início
        </Button>
        <Button variant="primary" onClick={() => reset()}>
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
