import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditEventForm, EditEventInitialData } from "@/components/modules/events/EditEventForm";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

function formatToDatetimeLocal(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const userRole = headersList.get("x-user-role");

  if (!userId || userRole !== "ORGANIZER") {
    redirect("/login");
  }

  const { id } = await params;
  if (!id) {
    redirect("/organizer");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { sectors: true },
  });

  if (!event || event.organizerId !== userId) {
    redirect("/organizer");
  }

  // Parse City and UF
  let cityName = event.city || "";
  let stateUf = "";

  if (event.city && event.city.includes(",")) {
    const parts = event.city.split(",").map((p) => p.trim());
    cityName = parts[0] || "";
    stateUf = parts[1] || "";
  }

  const initialData: EditEventInitialData = {
    title: event.title,
    category: event.category as "SHOW" | "MOVIE" | "THEATER" | "FESTIVAL",
    description: event.description,
    bannerUrl: event.bannerUrl || "",
    eventDate: formatToDatetimeLocal(event.eventDate),
    endDate: event.endDate ? formatToDatetimeLocal(event.endDate) : "",
    locationName: event.locationName,
    cityName,
    stateUf,
    isAdult: event.isAdult,
  };

  return <EditEventForm eventId={event.id} initialData={initialData} />;
}
