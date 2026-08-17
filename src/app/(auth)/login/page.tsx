"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { loginSchema } from "@/lib/validations/auth";
import { Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();
  
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
      router.push(result.data.redirectUrl);
      router.refresh();
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
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            E-mail
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
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Senha
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

        <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
          Entrar
        </Button>
      </form>

      <div className="mt-8 border-t border-border-subtle pt-6">
        <p className="mb-4 text-center text-sm font-medium text-text-muted">
          Acesso Rápido (Ambiente de Teste)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrefill("ORGANIZER")} type="button">
            Organizador
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrefill("CUSTOMER")} type="button">
            Cliente 1 (Lucas)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrefill("CUSTOMER_2")} type="button">
            Cliente 2 (Camila)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrefill("GATEKEEPER")} type="button">
            Portaria (Roberto)
          </Button>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-bg-surface/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-text-muted">Faça login para acessar sua conta</p>
        </div>

        <Suspense fallback={<div className="text-center text-text-muted">Carregando formulário...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
