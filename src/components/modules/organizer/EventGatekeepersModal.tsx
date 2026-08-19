"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ShieldCheck, Plus, Trash2, Copy, Check, UserPlus, RefreshCw, Key } from "lucide-react";

interface GatekeeperItem {
  id: string;
  name: string;
  email: string;
  assignedAt: string;
}

interface EventGatekeepersModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export function EventGatekeepersModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: EventGatekeepersModalProps) {
  const { success, error: toastError } = useToast();

  const [gatekeepers, setGatekeepers] = React.useState<GatekeeperItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState("");
  const [autoGenerate, setAutoGenerate] = React.useState(true);
  const [customEmail, setCustomEmail] = React.useState("");
  const [customPassword, setCustomPassword] = React.useState("");

  // Last Generated Credentials Card
  const [createdAccount, setCreatedAccount] = React.useState<{
    name: string;
    email: string;
    password?: string;
  } | null>(null);
  const [hasCopied, setHasCopied] = React.useState(false);

  const fetchGatekeepers = React.useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/gatekeepers`);
      const data = await res.json();
      if (res.ok && data.success) {
        setGatekeepers(data.gatekeepers || []);
      } else {
        toastError(data.error || "Erro ao carregar lista de portaria.");
      }
    } catch {
      toastError("Erro de conexão ao carregar equipe de portaria.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toastError]);

  React.useEffect(() => {
    if (isOpen) {
      fetchGatekeepers();
      setCreatedAccount(null);
      setName("");
      setCustomEmail("");
      setCustomPassword("");
      setAutoGenerate(true);
    }
  }, [isOpen, fetchGatekeepers]);

  const handleCreateGatekeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toastError("Nome ou identificação da portaria é obrigatório (mínimo 2 caracteres).");
      return;
    }

    if (!autoGenerate) {
      if (!customEmail.trim() || !customEmail.includes("@")) {
        toastError("Insira um e-mail válido.");
        return;
      }
      if (!customPassword || customPassword.length < 6) {
        toastError("A senha personalizada deve ter no mínimo 6 caracteres.");
        return;
      }
    }

    setIsCreating(true);
    try {
      const payload = {
        name: name.trim(),
        autoGenerate,
        email: autoGenerate ? undefined : customEmail.trim(),
        password: autoGenerate ? undefined : customPassword,
      };

      const res = await fetch(`/api/events/${eventId}/gatekeepers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        success("Conta de portaria vinculada com sucesso!");
        setCreatedAccount({
          name: data.gatekeeper.name,
          email: data.gatekeeper.email,
          password: data.gatekeeper.generatedPassword || customPassword,
        });
        setHasCopied(false);
        setName("");
        setCustomEmail("");
        setCustomPassword("");
        fetchGatekeepers();
      } else {
        toastError(data.error || "Falha ao gerar conta de portaria.");
      }
    } catch {
      toastError("Erro de conexão ao criar conta de portaria.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGatekeeper = async (gatekeeperId: string) => {
    setDeletingId(gatekeeperId);
    try {
      const res = await fetch(`/api/events/${eventId}/gatekeepers/${gatekeeperId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        success("Operador desvinculado do evento com sucesso.");
        setGatekeepers((prev) => prev.filter((g) => g.id !== gatekeeperId));
      } else {
        toastError(data.error || "Erro ao desvincular operador.");
      }
    } catch {
      toastError("Erro de conexão ao desvincular operador.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyCredentials = async () => {
    if (!createdAccount) return;
    const textToCopy = `🎫 Credenciais de Acesso à Portaria
Evento: ${eventTitle}
E-mail: ${createdAccount.email}
Senha: ${createdAccount.password}
Acesse: ${window.location.origin}/login`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      success("Credenciais copiadas para a área de transferência!");
      setTimeout(() => setHasCopied(false), 3000);
    } catch {
      toastError("Não foi possível copiar automaticamente.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Equipe de Portaria do Evento" className="max-w-xl">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-text-muted">
            Gerencie os operadores com acesso para validar ingressos em:{" "}
            <strong className="text-text-primary">{eventTitle}</strong>
          </p>
        </div>

        {/* Card de Credenciais Recém-Geradas */}
        {createdAccount && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Key className="w-4 h-4" />
                <span>Conta Criada e Vinculada</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyCredentials}
                className="gap-1.5 text-xs h-8"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Credenciais
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-bg-surface p-3 rounded-lg border border-border-subtle">
              <div>
                <span className="text-text-muted block">Operador / Posto:</span>
                <span className="font-medium text-text-primary">{createdAccount.name}</span>
              </div>
              <div>
                <span className="text-text-muted block">E-mail de Login:</span>
                <span className="font-mono text-primary font-semibold">{createdAccount.email}</span>
              </div>
              {createdAccount.password && (
                <div className="sm:col-span-2 pt-1 border-t border-border-subtle mt-1">
                  <span className="text-text-muted block">Senha de Acesso:</span>
                  <span className="font-mono text-text-primary font-bold bg-bg-main px-2 py-0.5 rounded inline-block mt-0.5">
                    {createdAccount.password}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulário de Criação Rápida */}
        <form onSubmit={handleCreateGatekeeper} className="rounded-xl border border-border-subtle bg-bg-surface p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Gerar Nova Conta de Portaria</span>
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoGen"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle text-primary accent-primary cursor-pointer"
              />
              <label htmlFor="autoGen" className="text-xs text-text-muted cursor-pointer select-none">
                Credenciais Automáticas
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-text-primary">
                Identificação do Posto / Operador
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Portão A - Catraca 01 ou Roberto Silva"
                className="text-sm"
              />
            </div>

            {!autoGenerate && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-primary">E-mail</label>
                  <Input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="portaria@empresa.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-primary">Senha</label>
                  <Input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" loading={isCreating} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Gerar e Vincular Conta
            </Button>
          </div>
        </form>

        {/* Lista de Operadores Vinculados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Operadores Autorizados ({gatekeepers.length})</span>
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchGatekeepers}
              disabled={isLoading}
              className="text-xs h-7 text-text-muted"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-6 text-xs text-text-muted">
              Carregando equipe de portaria...
            </div>
          ) : gatekeepers.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl text-text-muted text-xs bg-bg-main/50 p-4">
              Nenhum operador vinculado a este evento ainda. Gere uma conta acima para autorizar o acesso.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-surface overflow-hidden max-h-60 overflow-y-auto">
              {gatekeepers.map((gk) => (
                <div
                  key={gk.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{gk.name}</p>
                    <p className="text-xs text-text-muted font-mono truncate">{gk.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="success" className="text-[10px]">
                      Ativo
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGatekeeper(gk.id)}
                      disabled={deletingId === gk.id}
                      className="text-danger hover:bg-danger/10 h-8 w-8 p-0"
                      title="Desvincular operador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border-subtle">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
