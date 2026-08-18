import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CheckoutClient from "./CheckoutClient";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  
  if (!session || session.role !== "CUSTOMER") {
    redirect("/login?returnUrl=/checkout");
  }

  const { reservationId } = await searchParams;

  if (!reservationId || typeof reservationId !== "string") {
    redirect("/");
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      event: true,
      items: {
        include: {
          sector: true,
          seat: true,
        },
      },
    },
  });

  if (!reservation || reservation.userId !== session.id) {
    redirect("/");
  }

  const isPending = reservation.status === "PENDING";
  const isExpired = reservation.expiresAt < new Date();

  // Se já não estiver pendente ou estiver expirada, o componente cliente
  // cuidará de exibir o estado expirado corretamente se estivermos passando as props
  // Para ser mais fluido, se expirar no server side podemos renderizar a página,
  // mas marcando como expirado para o timer não rodar e o usuário não conseguir pagar.

  const totalAmount = reservation.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-main pb-16 pt-24">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Finalizar Compra</h1>
        <CheckoutClient
          reservationId={reservation.id}
          eventId={reservation.eventId}
          expiresAt={reservation.expiresAt.toISOString()}
          totalAmount={totalAmount}
          items={reservation.items}
          eventName={reservation.event.title}
        />
      </div>
    </div>
  );
}
