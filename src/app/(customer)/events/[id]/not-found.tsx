import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function EventNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-hover">
        <AlertCircle className="h-10 w-10 text-text-muted" />
      </div>
      
      <h2 className="mb-2 text-3xl font-bold text-text-primary">
        Evento não encontrado
      </h2>
      
      <p className="mb-8 max-w-md text-text-muted">
        O evento que você está procurando não existe, foi cancelado ou não está mais disponível.
      </p>
      
      <Link 
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        Voltar para os eventos
      </Link>
    </div>
  );
}
