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
    if (role === "ORGANIZER") {
      setEmail("organizador@verzel.com");
      setPassword("senha123");
    } else if (role === "GATEKEEPER") {
      setEmail("portaria@verzel.com");
      setPassword("senha123");
    } else {
      setEmail("cliente1@verzel.com");
      setPassword("senha123");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-200">
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
          <label className="mb-1.5 block text-sm font-medium text-slate-200">
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

      <div className="mt-8 border-t border-slate-700 pt-6">
        <p className="mb-4 text-center text-sm font-medium text-slate-400">
          Acesso Rápido (Ambiente de Teste)
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrefill("ORGANIZER")} type="button">
            Preencher como Organizador
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrefill("CUSTOMER")} type="button">
            Preencher como Cliente
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrefill("GATEKEEPER")} type="button">
            Preencher como Portaria
          </Button>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-100">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-slate-400">Faça login para acessar sua conta</p>
        </div>

        <Suspense fallback={<div className="text-center text-slate-400">Carregando formulário...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
