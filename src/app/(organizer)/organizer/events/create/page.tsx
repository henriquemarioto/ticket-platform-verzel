"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ExternalCatalogModal, CatalogItem } from "@/components/modules/events/ExternalCatalogModal";
import { Film, Music, Plus, Trash, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createEventSchema } from "@/lib/validations/events";
import { BRAZIL_STATES } from "@/lib/constants/brazil-states";
import { useRouter } from "next/navigation";

type SectorState = {
  id: string; // apenas local para o react key
  name: string;
  type: "GENERAL_ADMISSION" | "NUMBERED_SEATS";
  price: string;
  totalCapacity: string;
  rowsStr: string;
  seatsPerRow: string;
};

export default function CreateEventPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [modalProvider, setModalProvider] = React.useState<"TMDB" | "TICKETMASTER" | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("SHOW");
  const [description, setDescription] = React.useState("");
  const [bannerUrl, setBannerUrl] = React.useState("");
  const [locationName, setLocationName] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("");
  const [cityName, setCityName] = React.useState("");
  const [stateUf, setStateUf] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [entryStartTime, setEntryStartTime] = React.useState("");
  const [isEntryAutoFilled, setIsEntryAutoFilled] = React.useState(true);
  const [isAdult, setIsAdult] = React.useState(false);
  
  const [sectors, setSectors] = React.useState<SectorState[]>([]);

  const handleEventDateChange = (val: string) => {
    setEventDate(val);
    if (val) {
      const dateObj = new Date(val);
      if (!isNaN(dateObj.getTime())) {
        if (!entryStartTime || isEntryAutoFilled) {
          const suggested = new Date(dateObj.getTime() - 30 * 60 * 1000);
          const pad = (n: number) => String(n).padStart(2, "0");
          const formatted = `${suggested.getFullYear()}-${pad(suggested.getMonth() + 1)}-${pad(suggested.getDate())}T${pad(suggested.getHours())}:${pad(suggested.getMinutes())}`;
          setEntryStartTime(formatted);
          setIsEntryAutoFilled(true);
        }
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
      const parts = item.suggestedLocation.split(/[,-]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        setLocationName(parts[0]);
        setCityName(parts[1]);
        const maybeUf = parts[2].toUpperCase();
        if (BRAZIL_STATES.some(s => s.uf === maybeUf)) {
          setStateUf(maybeUf);
        } else {
          setStateUf("");
        }
      } else if (parts.length === 2) {
        const maybeUf = parts[1].toUpperCase();
        if (BRAZIL_STATES.some(s => s.uf === maybeUf)) {
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

  const addSector = () => {
    setSectors([
      ...sectors,
      { id: Date.now().toString(), name: "", type: "GENERAL_ADMISSION", price: "", totalCapacity: "", rowsStr: "", seatsPerRow: "" }
    ]);
  };

  const removeSector = (id: string) => {
    setSectors(sectors.filter(s => s.id !== id));
  };

  const updateSector = (id: string, field: keyof SectorState, value: string) => {
    setSectors(sectors.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const calculateNumberedSeats = (rowsStr: string, seatsPerRow: string) => {
    if (!rowsStr || !seatsPerRow) return 0;
    const rows = rowsStr.toUpperCase().split(",").map(r => r.trim()).filter(Boolean);
    return rows.length * (parseInt(seatsPerRow) || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const city = cityName.trim() && stateUf.trim() ? `${cityName.trim()}, ${stateUf.trim()}` : cityName.trim();

    // Prepare payload
    const payload = {
      title,
      description,
      category,
      bannerUrl,
      locationName,
      street,
      number,
      neighborhood,
      city,
      eventDate: eventDate ? new Date(eventDate).toISOString() : "",
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      entryStartTime: entryStartTime ? new Date(entryStartTime).toISOString() : "",
      isAdult,
      sectors: sectors.map(s => ({
        name: s.name,
        type: s.type,
        price: parseFloat(s.price),
        totalCapacity: s.type === "GENERAL_ADMISSION" ? parseInt(s.totalCapacity) : undefined,
        rows: s.type === "NUMBERED_SEATS" ? s.rowsStr.toUpperCase().split(",").map(r => r.trim()).filter(Boolean) : undefined,
        seatsPerRow: s.type === "NUMBERED_SEATS" ? parseInt(s.seatsPerRow) : undefined,
      }))
    };

    const validation = createEventSchema.safeParse(payload);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toastError("Corrija os erros no formulário antes de continuar.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        success("Evento publicado com sucesso!");
        router.push("/organizer");
      } else {
        toastError(data.error || "Falha ao criar o evento.");
      }
    } catch (err) {
      toastError("Erro de conexão ao tentar criar o evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Criar Novo Evento</h1>
          <p className="text-text-muted">
            Preencha os detalhes do evento ou importe os dados de catálogos externos para maior agilidade.
          </p>
        </div>

        {/* Integração de Catálogos (UC06 / UC07) */}
        <div className="p-6 rounded-xl shadow-sm bg-bg-surface flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <h2 className="font-semibold mb-1">Preenchimento Inteligente</h2>
            <p className="text-sm text-text-muted">Busque por filmes ou shows para autopreencher o formulário abaixo.</p>
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
                  <Button variant="danger" size="sm" type="button" onClick={() => setBannerUrl("")}>Remover Capa</Button>
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
                  onChange={(e) => setCategory(e.target.value)}
                  error={errors["category"]}
                >
                  <option value="SHOW">Show</option>
                  <option value="MOVIE">Filme</option>
                  <option value="THEATER">Teatro</option>
                  <option value="FESTIVAL">Festival</option>
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
                  error={errors["city"]}
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-text-primary">UF (Estado)</label>
                <Select
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value)}
                  error={errors["city"]}
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

          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-xl font-semibold">Setores e Ingressos</h2>
              <Button type="button" variant="outline" size="sm" onClick={addSector}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar Setor
              </Button>
            </div>
            
            {errors["sectors"] && (
              <div className="flex items-center gap-1 text-sm text-danger mt-1 bg-danger/10 p-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{errors["sectors"]}</span>
              </div>
            )}

            {sectors.length === 0 ? (
              <div className="text-center p-8 border border-dashed shadow-sm rounded-xl text-text-muted bg-bg-surface">
                Nenhum setor adicionado. Adicione ao menos um setor para vender ingressos.
              </div>
            ) : (
              <div className="space-y-4">
                {sectors.map((sector, index) => (
                  <div key={sector.id} className="p-5 shadow-sm rounded-xl bg-bg-surface space-y-4 relative">
                    <div className="absolute top-4 right-4">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSector(sector.id)} className="text-danger hover:bg-danger/10">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>

                    <h3 className="font-medium text-primary">Setor {index + 1}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Nome do Setor</label>
                        <Input 
                          value={sector.name} 
                          onChange={(e) => updateSector(sector.id, "name", e.target.value)}
                          placeholder="Ex: Pista Premium"
                          error={errors[`sectors.${index}.name`]}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Tipo de Setor</label>
                        <Select
                          value={sector.type}
                          onChange={(e) => updateSector(sector.id, "type", e.target.value)}
                          error={errors[`sectors.${index}.type`]}
                        >
                          <option value="GENERAL_ADMISSION">Pista (Lotação Livre)</option>
                          <option value="NUMBERED_SEATS">Assentos Numerados</option>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Preço Unitário (R$)</label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={sector.price} 
                          onChange={(e) => updateSector(sector.id, "price", e.target.value)}
                          placeholder="150.00"
                          error={errors[`sectors.${index}.price`]}
                        />
                      </div>
                    </div>

                    {sector.type === "GENERAL_ADMISSION" ? (
                      <div className="space-y-1">
                        <label className="text-xs text-text-muted">Capacidade Total</label>
                        <Input 
                          type="number"
                          value={sector.totalCapacity} 
                          onChange={(e) => updateSector(sector.id, "totalCapacity", e.target.value)}
                          placeholder="Ex: 1000"
                          error={errors[`sectors.${index}.totalCapacity`]}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-text-muted">Letras das Fileiras (Separadas por vírgula)</label>
                            <Input 
                              value={sector.rowsStr} 
                              onChange={(e) => updateSector(sector.id, "rowsStr", e.target.value.toUpperCase())}
                              placeholder="Ex: A, B, C, D"
                              error={errors[`sectors.${index}.rows`]}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-text-muted">Quantidade de Assentos por Fileira</label>
                            <Input 
                              type="number"
                              value={sector.seatsPerRow} 
                              onChange={(e) => updateSector(sector.id, "seatsPerRow", e.target.value)}
                              placeholder="Ex: 10"
                              error={errors[`sectors.${index}.seatsPerRow`]}
                            />
                          </div>
                        </div>

                        {sector.rowsStr && sector.seatsPerRow && parseInt(sector.seatsPerRow) > 0 && (
                          <div className="mt-4 p-4 bg-bg-main rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium mb-4 text-center">Preview do Mapa de Assentos</h4>
                            <div className="flex flex-col gap-2 overflow-x-auto pb-4 items-center">
                              {/* Palco */}
                              <div className="w-3/4 h-8 bg-primary/20 shadow-sm ring-1 ring-primary/50 rounded-t-full mb-6 flex items-center justify-center text-xs text-primary font-semibold">
                                PALCO
                              </div>
                              
                              {sector.rowsStr.toUpperCase().split(",").map(r => r.trim()).filter(Boolean).map(row => (
                                <div key={row} className="flex gap-2 min-w-max items-center">
                                  <div className="w-6 text-xs font-bold text-text-muted text-right pr-2">{row}</div>
                                  {Array.from({ length: Math.min(parseInt(sector.seatsPerRow), 50) }).map((_, i) => (
                                    <div 
                                      key={`${row}${i+1}`} 
                                      className="w-8 h-8 rounded-t-lg bg-surface-hover shadow-sm flex items-center justify-center text-[10px] text-text-muted"
                                      title={`Assento ${row}${i+1}`}
                                    >
                                      {row}{i+1}
                                    </div>
                                  ))}
                                  {parseInt(sector.seatsPerRow) > 50 && (
                                    <div className="text-xs text-text-muted px-2">...</div>
                                  )}
                                  <div className="w-6 text-xs font-bold text-text-muted pl-2">{row}</div>
                                </div>
                              ))}
                            </div>
                            <div className="text-center text-xs text-text-muted mt-4">
                              Capacidade Total Gerada: <strong className="text-text-primary">{calculateNumberedSeats(sector.rowsStr, sector.seatsPerRow)} assentos</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6">
            <Button type="submit" size="lg" loading={isSubmitting}>
              Publicar Evento
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
