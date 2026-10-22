import crypto from "crypto";

/**
 * Gera o payload do QR Code com assinatura HMAC-SHA256 completa de 256 bits (64 caracteres hex)
 * para prevenção matemática contra falsificação de vouchers de ingresso.
 *
 * @param ticketCode Código único e legível do ingresso.
 * @param eventId ID do evento.
 * @param timestamp Timestamp Unix (em segundos) do momento da emissão.
 * @returns Um objeto contendo a assinatura (secureToken) e o payload completo para o QR Code.
 */
export function generateTicketQRPayload(ticketCode: string, eventId: string, timestamp: number) {
  const secret = process.env.QR_HMAC_SECRET;
  
  if (!secret) {
    throw new Error("ERRO FATAL: Variável QR_HMAC_SECRET não definida no ambiente.");
  }

  // Mensagem canônica exigida no Use Case 19
  const message = `v1:${ticketCode}:${eventId}:${timestamp}`;
  
  // Gera o hash HMAC-SHA256 completo de 256 bits (64 caracteres hexadecimais)
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
  
  return {
    secureToken: signature,
    qrPayload: `${message}:${signature}`,
  };
}

/**
 * Gera uma palavra-chave (passcode) curta e segura baseada no token de compartilhamento.
 */
export function generateSharePasscode(shareToken: string) {
  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) {
    throw new Error("ERRO FATAL: Variável QR_HMAC_SECRET não definida no ambiente.");
  }
  
  return crypto
    .createHmac("sha256", secret)
    .update(shareToken)
    .digest("hex")
    .slice(0, 6);
}

export interface ParsedQRPayload {
  version: string;
  ticketCode: string;
  eventId: string;
  timestamp: number;
  signature: string;
  isValidSignature: boolean;
}

/**
 * Decodifica o payload do QR Code e valida a assinatura HMAC-SHA256 em tempo constante (timing-safe).
 */
export function parseAndVerifyQRPayload(qrPayload: string): ParsedQRPayload | null {
  const parts = qrPayload.split(":");
  if (parts.length !== 5 || parts[0] !== "v1") return null;

  const [version, ticketCode, eventId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  // A assinatura deve conter exatamente 64 caracteres hexadecimais (256 bits)
  if (signature.length !== 64 || !/^[0-9a-f]{64}$/i.test(signature)) {
    return { version, ticketCode, eventId, timestamp, signature, isValidSignature: false };
  }

  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) throw new Error("ERRO FATAL: Variável QR_HMAC_SECRET não definida no ambiente.");

  const message = `v1:${ticketCode}:${eventId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  const isValidSignature = crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );

  return { version, ticketCode, eventId, timestamp, signature, isValidSignature };
}

/**
 * Gera código de ingresso único usando CSPRNG (crypto.randomInt e crypto.randomBytes)
 * Formato: ELT-####-XXXX (ex: ELT-4821-B9F2)
 */
export function generateSecureTicketCode(): string {
  const numericPart = crypto.randomInt(1000, 10000);
  const hexPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ELT-${numericPart}-${hexPart}`;
}

/**
 * Gera senha temporária de portaria usando CSPRNG
 * Formato: Gate# + 6 caracteres seguros
 */
export function generateSecureGatekeeperPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `Gate#${suffix}`;
}
