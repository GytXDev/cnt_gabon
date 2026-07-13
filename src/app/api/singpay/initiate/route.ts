import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function generateRandomString(length: number = 6) {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
}

export async function POST(request: Request) {
    try {
        const { numero, amount } = await request.json();

        if (!numero || !amount) {
            return NextResponse.json({ success: false, message: "Numéro ou montant manquant." }, { status: 400 });
        }

        const reference = generateRandomString();
        const url = 'https://gateway.singpay.ga/v1/74/paiement';

        // Si MODE=test est défini dans les variables d'environnement, on force le montant de test à 100 CFA
        const isTestMode = process.env.MODE === 'test';
        const finalAmount = isTestMode ? "100" : amount.toString();

        const data = {
            amount: finalAmount,
            reference,
            client_msisdn: numero,
            portefeuille: '661766093fbb7a1bd42da1b5',
            disbursement: '6617ce313fbb7a80ac2da1ff',
            isTransfer: true
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'x-client-id': '0d2ced90-5398-4f6f-a830-b72fe4caefd2',
                'x-client-secret': '85a8209452c1d5fbeefd6006b8d1105608bf0d61ba7d8d86c211811b752422d0',
                'x-wallet': '661766093fbb7a1bd42da1b5',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            cache: 'no-store'
        });

        const result = await response.json();

        if (result.transaction && result.transaction.id) {
            return NextResponse.json({ success: true, transactionId: result.transaction.id, data: result });
        } else if (result.status && result.status.message) {
            return NextResponse.json({ success: false, message: result.status.message, data: result }, { status: 400 });
        } else {
            return NextResponse.json({ success: false, message: "Erreur lors de l'initialisation du paiement.", data: result }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: "Erreur interne: " + error.message }, { status: 500 });
    }
}
