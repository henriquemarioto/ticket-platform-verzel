/**
 * Utilitários centralizados para formatação de datas e intervalos de eventos
 */

const MONTHS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function toDate(d: Date | string | number): Date {
  return typeof d === "object" && d instanceof Date ? d : new Date(d);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Formata um intervalo de datas para exibição completa detalhada (telas de detalhes, vouchers, etc.)
 *
 * Exemplos:
 * - Mesmo dia: "20 de Novembro de 2026 • 20:00 às 23:30"
 * - Dias distintos: "20/11/2026 20:00 até 22/11/2026 23:00"
 * - Sem data final: "20 de Novembro de 2026 às 20:00"
 */
export function formatEventDateRange(
  startDate: Date | string | number,
  endDate?: Date | string | number | null
): string {
  if (!startDate) return "";

  const start = toDate(startDate);
  if (isNaN(start.getTime())) return "";

  const end = endDate ? toDate(endDate) : null;
  const hasValidEnd = end && !isNaN(end.getTime());

  if (!hasValidEnd) {
    return `${start.getDate()} de ${MONTHS_FULL[start.getMonth()]} de ${start.getFullYear()} às ${formatTime(start)}`;
  }

  const isSameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (isSameDay) {
    return `${start.getDate()} de ${MONTHS_FULL[start.getMonth()]} de ${start.getFullYear()} • ${formatTime(start)} às ${formatTime(end)}`;
  }

  const startStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()} ${formatTime(start)}`;
  const endStr = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()} ${formatTime(end)}`;
  return `${startStr} até ${endStr}`;
}

/**
 * Formata um intervalo de datas para exibição curta e concisa (cards, tabelas, resumos, etc.)
 *
 * Exemplos:
 * - Mesmo dia: "20 Nov 2026, 20:00 - 23:30"
 * - Dias distintos: "20 Nov - 22 Nov 2026" (ou "20 Nov 2025 - 02 Jan 2026" se anos diferentes)
 * - Sem data final: "20 Nov 2026, 20:00"
 */
export function formatShortDateRange(
  startDate: Date | string | number,
  endDate?: Date | string | number | null
): string {
  if (!startDate) return "";

  const start = toDate(startDate);
  if (isNaN(start.getTime())) return "";

  const end = endDate ? toDate(endDate) : null;
  const hasValidEnd = end && !isNaN(end.getTime());

  if (!hasValidEnd) {
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}, ${formatTime(start)}`;
  }

  const isSameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (isSameDay) {
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}, ${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

/**
 * Formata o horário de abertura dos portões com contexto de data
 *
 * Exemplos:
 * - Mesmo dia do evento: "Abertura dos portões às 19:30"
 * - Data diferente: "Abertura dos portões em 20/11 às 19:30"
 */
export function formatEntryTime(
  entryStartTime: Date | string | number,
  eventDate?: Date | string | number
): string {
  if (!entryStartTime) return "";
  const entry = toDate(entryStartTime);
  if (isNaN(entry.getTime())) return "";

  if (eventDate) {
    const event = toDate(eventDate);
    const isSameDay =
      !isNaN(event.getTime()) &&
      entry.getFullYear() === event.getFullYear() &&
      entry.getMonth() === event.getMonth() &&
      entry.getDate() === event.getDate();

    if (isSameDay) {
      return `Abertura dos portões às ${formatTime(entry)}`;
    }
  }

  return `Abertura dos portões em ${pad(entry.getDate())}/${pad(entry.getMonth() + 1)} às ${formatTime(entry)}`;
}

/**
 * Formata um objeto Date, string ou timestamp para o formato de input datetime-local (YYYY-MM-DDTHH:mm)
 */
export function formatToDatetimeLocal(date: Date | string | number = new Date()): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

