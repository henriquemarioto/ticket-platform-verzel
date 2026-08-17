import crypto from "crypto";

/**
 * Gera o payload do QR Code com uma assinatura HMAC-SHA256 para prevenir forjamento.
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
  
  // Gera o hash HMAC-SHA256 e trunca para 32 caracteres (hex)
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex")
    .slice(0, 32);
  
  return {
    secureToken: signature,
    qrPayload: `${message}:${signature}`,
  };
}

/**
 * Gera uma palavra-chave (passcode) curta e segura baseada no token de compartilhamento.
 * Isso adiciona uma segunda camada de segurança (2FA-like) para links públicos,
 * impedindo acesso mesmo que o UUID do ingresso vaze ou seja alvo de brute force.
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

export function parseAndVerifyQRPayload(qrPayload: string): ParsedQRPayload | null {
  const parts = qrPayload.split(":");
  if (parts.length !== 5 || parts[0] !== "v1") return null;

  const [version, ticketCode, eventId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) throw new Error("ERRO FATAL: Variável QR_HMAC_SECRET não definida no ambiente.");

  const message = `v1:${ticketCode}:${eventId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex")
    .slice(0, 32);

  const isValidSignature =
    signature.length === 32 &&
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

  return { version, ticketCode, eventId, timestamp, signature, isValidSignature };
}
