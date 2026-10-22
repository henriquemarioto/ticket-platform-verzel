import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class ServiceError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode: number = 400, code?: string, details?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(
  error: unknown,
  context: string,
  fallbackMessage: string = "Erro interno no servidor"
) {
  if (error instanceof ServiceError) {
    logger.warn(`[${context}] ServiceError: ${error.message}`, {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    });
    const extraFields =
      error.details && typeof error.details === "object" && !Array.isArray(error.details)
        ? error.details
        : error.details ? { details: error.details } : {};

    return NextResponse.json(
      {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
        ...extraFields,
      },
      { status: error.statusCode }
    );
  }

  logger.error(`[${context}] Falha inesperada: ${fallbackMessage}`, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
