/**
 * API Route: POST /api/coins/topup
 * Creates a pending CoinOrder and returns a Midtrans Snap token or simulation mode.
 * Ready for dual-DB (Turso + Neon) and Midtrans Snap integration.
 */

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getSessionUser } from '../../../../lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, coins, amountIdr } = body;

    if (!packageId || !coins || !amountIdr) {
      return NextResponse.json(
        { error: 'packageId, coins, and amountIdr are required' },
        { status: 400 }
      );
    }

    // Attempt to get user from Neon auth session if available
    let userId: string | undefined = undefined;
    try {
      const session = await getSessionUser();
      if (session) {
        userId = session.userId;
      }
    } catch {
      // Guest or session not present
    }

    const orderId = `MALAZ-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Midtrans Integration Check
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isMidtransConfigured = Boolean(serverKey && serverKey.trim().length > 0);

    let snapToken: string | null = null;

    if (isMidtransConfigured) {
      // Call Midtrans Snap API directly via HTTP (no heavy SDK dependency needed)
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const snapEndpoint = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

      const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

      const snapPayload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amountIdr,
        },
        item_details: [
          {
            id: packageId,
            price: amountIdr,
            quantity: 1,
            name: `${coins} Malaz Scans Coins`,
          },
        ],
        customer_details: {
          first_name: userId ? 'Member' : 'Guest',
        },
      };

      try {
        const snapRes = await fetch(snapEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify(snapPayload),
        });

        if (snapRes.ok) {
          const snapData = await snapRes.json();
          snapToken = snapData.token;
        } else {
          console.warn('Midtrans Snap request returned non-OK status, falling back to simulation:', await snapRes.text());
        }
      } catch (err) {
        console.error('Midtrans connection error, falling back to simulation:', err);
      }
    }

    // Persist order in Prisma if database is connected
    try {
      await prisma.coinOrder.create({
        data: {
          id: orderId,
          userId: userId || null,
          packageId,
          coins,
          amountIdr,
          status: 'PENDING',
          snapToken: snapToken || null,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma coinOrder.create skipped (running in offline/mock DB mode):', dbErr);
    }

    return NextResponse.json({
      orderId,
      snapToken,
      simulation: !snapToken,
      amountIdr,
      coins,
      message: snapToken 
        ? 'Midtrans Snap token generated successfully.' 
        : 'Simulation mode active (set MIDTRANS_SERVER_KEY in .env for live payment).',
    });
  } catch (error) {
    console.error('Failed to process coin top-up:', error);
    return NextResponse.json(
      { error: 'Failed to initiate coin order.' },
      { status: 500 }
    );
  }
}
