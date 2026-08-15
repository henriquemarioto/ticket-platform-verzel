import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST() {
  await deleteSession();

  return NextResponse.json(
    { success: true, message: 'Sessão encerrada com sucesso.' },
    { status: 200 }
  );
}
