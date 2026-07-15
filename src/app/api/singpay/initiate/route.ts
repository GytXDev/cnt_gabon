import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helpers Singpay config depuis les variables d'env
function getSingpayHeaders() {
  return {
    'accept': '*/*',
    'x-client-id': process.env.SINGPAY_CLIENT_ID!,
    'x-client-secret': process.env.SINGPAY_CLIENT_SECRET!,
    'x-wallet': process.env.SINGPAY_WALLET_ID!,
    'Content-Type': 'application/json',
  };
}

function generateReference(length: number = 8) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ref = '';
  for (let i = 0; i < length; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
}

/**
 * Détecte si le numéro est Moov Money.
 * Moov Money Gabon : 065, 066, 062, 060, 063
 */
function detectProvider(numero: string): 'airtel' | 'moov' | 'unknown' {
  const n = numero.replace(/\D/g, '');
  const normalized = n.startsWith('0') ? n : '0' + n;

  if (/^0(74|77|76)/.test(normalized)) return 'airtel';
  if (/^0(65|66|62|60|63)/.test(normalized)) return 'moov';
  return 'unknown';
}

export async function POST(request: Request) {
  try {
    const { numero, amount } = await request.json();

    if (!numero || !amount) {
      return NextResponse.json(
        { success: false, message: 'Numéro ou montant manquant.' },
        { status: 400 }
      );
    }

    const provider = detectProvider(numero);

    if (provider === 'unknown') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Numéro non reconnu. Utilisez un numéro Airtel Money (074, 077, 076) ou Moov Money (065, 066, 062, 060).',
        },
        { status: 400 }
      );
    }

    const isTestMode = process.env.MODE === 'test';
    const finalAmount = isTestMode ? '100' : amount.toString();
    const reference = generateReference();
    const gatewayUrl = process.env.SINGPAY_GATEWAY_URL!;

    // Sélection endpoint et disbursement selon l'opérateur
    const endpoint =
      provider === 'airtel'
        ? `${gatewayUrl}/74/paiement`   // Airtel Money
        : `${gatewayUrl}/62/paiement`;  // Moov Money

    const disbursement =
      provider === 'airtel'
        ? process.env.SINGPAY_DISBURSEMENT_AIRTEL!
        : process.env.SINGPAY_DISBURSEMENT_MOOV!;

    const data = {
      amount: finalAmount,
      reference,
      client_msisdn: numero,
      portefeuille: process.env.SINGPAY_WALLET_ID!,
      disbursement,
      isTransfer: true,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getSingpayHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    const result = await response.json();

    if (result.transaction && result.transaction.id) {
      return NextResponse.json({
        success: true,
        transactionId: result.transaction.id,
        provider,
        data: result,
      });
    } else if (result.status && result.status.message) {
      return NextResponse.json(
        { success: false, message: result.status.message, data: result },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'initialisation du paiement.", data: result },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Erreur interne: ' + error.message },
      { status: 500 }
    );
  }
}
