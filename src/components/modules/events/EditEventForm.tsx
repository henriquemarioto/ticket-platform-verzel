"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ExternalCatalogModal, CatalogItem } from "@/components/modules/events/ExternalCatalogModal";
import { Film, Music, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { BRAZIL_STATES } from "@/lib/constants/brazil-states";
import { EVENT_CATEGORIES_OPTIONS } from "@/lib/constants/event-categories";
import { updateEventSchema } from "@/lib/validations/events";
import { formatToDatetimeLocal } from "@/lib/utils/date-formatters";

export interface EditEventInitialData {
  title: string;
  category: "SHOW" | "MOVIE" | "THEATER" | "FESTIVAL";
  description: string;
  bannerUrl: string;
  eventDate: string; // YYYY-MM-DDTHH:mm
  endDate?: string | null; // YYYY-MM-DDTHH:mm
  entryStartTime: string; // YYYY-MM-DDTHH:mm
  locationName: string;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  cityName: string;
  stateUf: string;
  isAdult: boolean;
}

interface EditEventFormProps {
  eventId: string;
  initialData: EditEventInitialData;
}

export function EditEventForm({ eventId, initialData }: EditEventFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [modalProvider, setModalProvider] = React.useState<"TMDB" | "TICKETMASTER" | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = React.useState(initialData.title || "");
  const [category, setCategory] = React.useState(initialData.category || "SHOW");
  const [description, setDescription] = React.useState(initialData.description || "");
  const [bannerUrl, setBannerUrl] = React.useState(initialData.bannerUrl || "");
  const [locationName, setLocationName] = React.useState(initialData.locationName || "");
  const [street, setStreet] = React.useState(initialData.street || "");
  const [number, setNumber] = React.useState(initialData.number || "");
  const [neighborhood, setNeighborhood] = React.useState(initialData.neighborhood || "");
  const [cityName, setCityName] = React.useState(initialData.cityName || "");
  const [stateUf, setStateUf] = React.useState(initialData.stateUf || "");
  const [eventDate, setEventDate] = React.useState(initialData.eventDate || "");
  const [endDate, setEndDate] = React.useState(initialData.endDate || "");
  const [entryStartTime, setEntryStartTime] = React.useState(initialData.entryStartTime || "");
  const [isEntryAutoFilled, setIsEntryAutoFilled] = React.useState(false);
  const [isAdult, setIsAdult] = React.useState(initialData.isAdult || false);

  const handleEventDateChange = (val: string) => {
    setEventDate(val);
    if (val) {
      const dateObj = new Date(val);
      if (!isNaN(dateObj.getTime()) && (!entryStartTime || isEntryAutoFilled)) {
        const suggested = new Date(dateObj.getTime() - 30 * 60 * 1000);
        setEntryStartTime(formatToDatetimeLocal(suggested));
        setIsEntryAutoFilled(true);
      }
    }
  };

  const handleEntryStartTimeChange = (val: string) => {
    setEntryStartTime(val);
    setIsEntryAutoFilled(false);
  };

  const handleSelectFromCatalog = (item: CatalogItem) => {
    setTitle(item.title);
    setCategory(item.category);
    if (item.overview || item.genre) {
      setDescription(item.overview || item.genre || "");
    }
    if (item.bannerUrl || item.posterUrl) {
      setBannerUrl(item.bannerUrl || item.posterUrl || "");
    }
    if (item.suggestedLocation) {
      const parts = item.suggestedLocation.split(/[,-]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        setLocationName(parts[0]);
        setCityName(parts[1]);
        const maybeUf = parts[2].toUpperCase();
        if (BRAZIL_STATES.some((s) => s.uf === maybeUf)) {
          setStateUf(maybeUf);
        } else {
          setStateUf("");
        }
      } else if (parts.length === 2) {
        const maybeUf = parts[1].toUpperCase();
        if (BRAZIL_STATES.some((s) => s.uf === maybeUf)) {
          setCityName(parts[0]);
          setStateUf(maybeUf);
        } else {
          setLocationName(parts[0]);
          setCityName(parts[1]);
        }
      } else {
        setLocationName(item.suggestedLocation);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const city = cityName.trim() && stateUf.trim() ? `${cityName.trim()}, ${stateUf.trim()}` : cityName.trim();

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      bannerUrl: bannerUrl.trim(),
      locationName: locationName.trim(),
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      city,
      eventDate: eventDate ? new Date(eventDate).toISOString() : "",
      endDate: endDate && endDate.trim() !== "" ? new Date(endDate).toISOString() : null,
      entryStartTime: entryStartTime ? new Date(entryStartTime).toISOString() : "",
      isAdult,
    };

    const validation = updateEventSchema.safeParse(payload);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      if (fieldErrors["city"]) {
        if (!cityName.trim()) fieldErrors["cityName"] = "Cidade é obrigatória.";
        if (!stateUf.trim()) fieldErrors["stateUf"] = "UF (Estado) é obrigatório.";
      }
      setErrors(fieldErrors);
      toastError("Corrija os erros no formulário antes de continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (res.ok && (data.success || data.event)) {
        success("Evento atualizado com sucesso!");
        router.push("/organizer");
        router.refresh();
      } else {
        toastError(data.error || "Falha ao atualizar o evento.");
      }
    } catch (err) {
      toastError("Erro de conexão ao tentar atualizar o evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/organizer">
            <Button variant="outline" size="sm" type="button" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Editar Evento</h1>
            <p className="text-text-muted text-sm">
              Atualize as informações do seu evento.
            </p>
          </div>
        </div>

        {/* Integração de Catálogos (UC06 / UC07) */}
        <div className="p-6 rounded-xl shadow-sm bg-bg-surface flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <h2 className="font-semibold mb-1">Preenchimento Inteligente</h2>
            <p className="text-sm text-text-muted">
              Importe ou atualize dados buscando por filmes ou shows nos catálogos integrados.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setModalProvider("TMDB")}
              className="flex-1 sm:flex-none"
              type="button"
            >
              <Film className="w-4 h-4 mr-2" />
              TMDb (Filmes)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setModalProvider("TICKETMASTER")}
              className="flex-1 sm:flex-none"
              type="button"
            >
              <Music className="w-4 h-4 mr-2" />
              Ticketmaster (Shows)
            </Button>
          </div>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold pb-2">Informações Básicas</h2>

            {bannerUrl && (
              <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-sm bg-black">
                <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-contain" />
                <div className="absolute top-2 right-2">
                  <Button variant="danger" size="sm" type="button" onClick={() => setBannerUrl("")}>
                    Remover Capa
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Título do Evento</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Festival de Verão"
                  error={errors["title"]}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Categoria</label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "SHOW" | "MOVIE" | "THEATER" | "FESTIVAL")}
                  error={errors["category"]}
                >
                  {EVENT_CATEGORIES_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Descrição / Sinopse</label>
                <span className={`text-xs ${description.length >= 300 ? "text-success font-medium" : "text-text-muted"}`}>
                  {description.length} / 300 caracteres
                </span>
              </div>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre o evento..."
                error={errors["description"]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">URL da Imagem de Capa</label>
              <Input 
                value={bannerUrl} 
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                error={errors["bannerUrl"]}
              />
            </div>

            {/* Horários e Datas com Portaria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">
                  Data e Hora de Início
                </label>
                <Input 
                  type="datetime-local"
                  value={eventDate} 
                  onChange={(e) => handleEventDateChange(e.target.value)}
                  min={formatToDatetimeLocal(new Date())}
                  error={errors["eventDate"]}
                />
                <p className="text-xs text-text-muted">
                  Início oficial das apresentações
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">
                  Data de Término (Opcional)
                </label>
                <Input 
                  type="datetime-local"
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  min={eventDate || formatToDatetimeLocal(new Date())}
                  error={errors["endDate"]}
                />
                <p className="text-xs text-text-muted">
                  Previsão de encerramento
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Abertura dos Portões
                  </label>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                    Portaria
                  </span>
                </div>
                <Input 
                  type="datetime-local"
                  value={entryStartTime} 
                  onChange={(e) => handleEntryStartTimeChange(e.target.value)}
                  min={formatToDatetimeLocal(new Date())}
                  error={errors["entryStartTime"]}
                />
                <p className="text-xs text-text-muted">
                  Entre 30m e 6h antes do início
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">Nome do Local</label>
                <Input 
                  value={locationName} 
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Allianz Parque"
                  error={errors["locationName"]}
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">Cidade</label>
                <Input 
                  value={cityName} 
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="Ex: São Paulo"
                  error={errors["cityName"] || errors["city"]}
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">UF (Estado)</label>
                <Select
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value)}
                  error={errors["stateUf"] || errors["city"]}
                >
                  <option value="">Selecione o Estado</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state.uf} value={state.uf}>
                      {state.uf} - {state.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">Rua / Logradouro</label>
                <Input 
                  value={street} 
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ex: Av. Francisco Matarazzo"
                  error={errors["street"]}
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">Número</label>
                <Input 
                  value={number} 
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: 1705 ou S/N"
                  error={errors["number"]}
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">Bairro</label>
                <Input 
                  value={neighborhood} 
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Água Branca"
                  error={errors["neighborhood"]}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-border">
              <input
                type="checkbox"
                id="isAdult"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle text-primary focus:ring-primary/50 cursor-pointer accent-primary"
              />
              <label htmlFor="isAdult" className="cursor-pointer text-sm font-medium text-text-primary select-none flex flex-col">
                <span className="flex items-center gap-1.5">
                  <span>Classificação Indicativa +18</span>
                  <span className="inline-flex items-center justify-center rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-bold text-danger">
                    +18
                  </span>
                </span>
                <span className="text-xs text-text-muted font-normal">
                  Marque se este evento for restrito para maiores de 18 anos.
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
            <Link href="/organizer">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" size="lg" loading={isSubmitting}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>

      <ExternalCatalogModal 
        isOpen={modalProvider !== null}
        onClose={() => setModalProvider(null)}
        provider={modalProvider || "TMDB"}
        onSelect={handleSelectFromCatalog}
      />
    </div>
  );
}
