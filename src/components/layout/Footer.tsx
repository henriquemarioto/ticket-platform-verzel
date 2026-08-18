import Link from "next/link";
import { Ticket } from "lucide-react";

export function Footer() {
  return (
    <footer className="shadow-sm bg-bg-surface py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">Verzel Tickets</span>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Verzel Tickets. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
