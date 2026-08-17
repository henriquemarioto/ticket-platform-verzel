import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-bg-surface p-4 rounded-full mb-6">
        <FileSearch className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">Página não encontrada</h1>
      <p className="text-text-muted mb-8 max-w-md">
        A página que você está procurando não existe, foi removida ou está temporariamente indisponível.
      </p>
      <Link href="/">
        <Button variant="primary">Voltar para o Início</Button>
      </Link>
    </div>
  );
}
