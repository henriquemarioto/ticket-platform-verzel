"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { registerSchema } from "@/lib/validations/auth";
import { processPendingPurchase } from "@/lib/utils/pending-purchase";
import { User, Mail, Lock, CheckCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const { success, error: toastError, toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "ORGANIZER">("CUSTOMER");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    name?: string; 
    email?: string; 
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const data = registerSchema.parse({ name, email, password, confirmPassword, role });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao fazer cadastro");
      }

      success("Cadastro realizado com sucesso!");
      await processPendingPurchase(result.data.user.role, result.data.redirectUrl, router, {
        success,
        warning: (msg) => toast("warning", msg),
        error: toastError,
        info: (msg) => toast("info", msg),
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((e: z.ZodIssue) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        toastError((err as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Nome
          </label>
          <Input
            type="text"
            placeholder="Seu nome completo"
            icon={<User />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={isLoading}
          />
        </div>

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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Confirmar Senha
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            icon={<CheckCircle />}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Tipo de Conta
          </label>
          <Select 
            value={role} 
            onChange={(e) => setRole(e.target.value as "CUSTOMER" | "ORGANIZER")}
            disabled={isLoading}
          >
            <option value="CUSTOMER">Cliente</option>
            <option value="ORGANIZER">Organizador</option>
          </Select>
        </div>

        <Button type="submit" variant="primary" className="w-full mt-4" loading={isLoading}>
          Cadastrar
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-text-muted">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg shadow-sm bg-bg-surface/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Criar uma conta</h1>
          <p className="mt-2 text-sm text-text-muted">Preencha os dados abaixo para se cadastrar</p>
        </div>

        <Suspense fallback={<div className="text-center text-text-muted">Carregando formulário...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
