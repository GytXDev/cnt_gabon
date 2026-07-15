import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(
  request: Request,
  { params }: { params: { trans_id: string } }
) {
  try {
    const { trans_id } = params;

    if (!trans_id) {
      return NextResponse.json(
        { success: false, message: 'ID de transaction manquant.' },
        { status: 400 }
      );
    }

    const url = `${process.env.SINGPAY_GATEWAY_URL}/transaction/api/status/${trans_id}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: '*/*',
        'x-client-id': process.env.SINGPAY_CLIENT_ID!,
        'x-client-secret': process.env.SINGPAY_CLIENT_SECRET!,
        'x-wallet': process.env.SINGPAY_WALLET_ID!,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    if (result.status && result.status.message) {
      return NextResponse.json({
        success: true,
        statusMessage: result.status.message,
        data: result,
      });
    } else {
      return NextResponse.json({
        success: false,
        errorType: 'gateway_error',
        message: 'Impossible de récupérer le statut de la transaction.',
        data: result,
      });
    }
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    return NextResponse.json({
      success: false,
      errorType: 'gateway_error',
      isTimeout,
      message: isTimeout
        ? 'Le serveur Singpay met trop de temps à répondre (Timeout).'
        : 'Erreur de connexion avec Singpay: ' + error.message,
    });
  }
}
