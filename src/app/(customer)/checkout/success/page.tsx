import Link from "next/link";
import { CheckCircle, Ticket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { orderId } = await searchParams;

  return (
    <div className="min-h-screen bg-main flex flex-col items-center justify-center py-24 px-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-sm p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Compra Confirmada!</h1>
          <p className="text-text-muted">
            Obrigado por sua compra. Seus ingressos foram emitidos com sucesso.
          </p>
        </div>

        {orderId && (
          <div className="bg-main/50 rounded-lg p-4 shadow-sm/50">
            <p className="text-sm text-text-muted mb-1">Número do Pedido</p>
            <p className="font-mono text-white font-medium">{orderId}</p>
          </div>
        )}

        <div className="pt-4 space-y-4">
          <Link href="/my-tickets" className="block">
            <Button variant="primary" className="w-full h-12 text-lg">
              <Ticket className="w-5 h-5 mr-2" />
              Ver Meus Ingressos
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full h-12 text-text-muted hover:text-white">
              Voltar para a Página Inicial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
