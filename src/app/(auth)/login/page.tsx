"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useToast } from "@/components/ui/toast";
import { loginSchema } from "@/lib/validations/auth";
import { processPendingPurchase } from "@/lib/utils/pending-purchase";
import { Mail, Lock, ShieldCheck, UserCheck, TicketCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError, toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const data = loginSchema.parse({ email, password });
      const returnUrl = searchParams.get("returnUrl") || undefined;

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, returnUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao fazer login");
      }

      success("Login realizado com sucesso!");
      await processPendingPurchase(result.data.user.role, result.data.redirectUrl, router, {
        success,
        warning: (msg) => toast("warning", msg),
        error: toastError,
        info: (msg) => toast("info", msg),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.issues.forEach((e: z.ZodIssue) => {
          if (e.path[0]) fieldErrors[e.path[0] as "email" | "password"] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        toastError((err as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefill = (role: string) => {
    setErrors({});
    if (role === "ORGANIZER") {
      setEmail("organizador@verzel.com.br");
      setPassword("Senha123!");
    } else if (role === "GATEKEEPER") {
      setEmail("portaria@verzel.com.br");
      setPassword("Senha123!");
    } else if (role === "CUSTOMER_2") {
      setEmail("cliente2@verzel.com.br");
      setPassword("Senha123!");
    } else {
      setEmail("cliente1@verzel.com.br");
      setPassword("Senha123!");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-primary">
            E-mail de Acesso
          </label>
          <Input
            type="email"
            placeholder="seu@email.com"
            icon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-text-primary">
            Senha Criptografada
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            icon={<Lock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={isLoading}
          />
        </div>

        <Button type="submit" variant="primary" className="w-full font-bold shadow-sm" loading={isLoading}>
          Entrar na Plataforma
        </Button>
      </form>

      {/* Cartões Táteis de Credencial para Homologação */}
      <div className="mt-8 pt-6 border-t border-border-subtle">
        <p className="mb-3 text-center text-xs font-mono uppercase tracking-wider text-text-muted">
          Acesso Rápido // Ambiente de Teste
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePrefill("ORGANIZER")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-border-subtle bg-bg-main hover:bg-bg-surface-hover hover:border-primary/40 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Organizador</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted mt-0.5">ORGANIZER</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrefill("CUSTOMER")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-border-subtle bg-bg-main hover:bg-bg-surface-hover hover:border-primary/40 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Cliente (Lucas)</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted mt-0.5">CUSTOMER #1</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrefill("CUSTOMER_2")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-border-subtle bg-bg-main hover:bg-bg-surface-hover hover:border-primary/40 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Cliente (Camila)</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted mt-0.5">CUSTOMER #2</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrefill("GATEKEEPER")}
            className="flex flex-col items-start p-2.5 rounded-lg border border-border-subtle bg-bg-main hover:bg-bg-surface-hover hover:border-primary/40 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <TicketCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portaria (Roberto)</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted mt-0.5">GATEKEEPER</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-editorial-grid">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-8 shadow-sm backdrop-blur-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <BrandLogo size="lg" className="mb-4" />
          <h1 className="text-xl font-bold text-text-primary">Bem-vindo de volta</h1>
          <p className="mt-1 text-xs text-text-muted">Informe suas credenciais para gerenciar ingressos</p>
        </div>

        <Suspense fallback={<div className="text-center text-text-muted text-xs">Carregando formulário...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-xs text-text-muted">
          Não possui cadastro?{" "}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
