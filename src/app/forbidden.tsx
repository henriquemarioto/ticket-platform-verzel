import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center">
      <ShieldAlert className="mb-6 h-20 w-20 text-danger" />
      <h1 className="mb-2 text-4xl font-bold text-text-primary">Acesso Negado</h1>
      <p className="mb-8 max-w-md text-lg text-text-muted">
        Você não tem permissão para acessar esta página. Se achar que isso é um erro, entre em contato com o suporte.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button variant="primary">Voltar ao Início</Button>
        </Link>
      </div>
    </div>
  );
}
