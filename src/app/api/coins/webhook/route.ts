/**
 * API Route: POST /api/coins/webhook
 * Handles Midtrans payment status notifications (webhooks).
 * Automatically updates order status and increments user coins upon settlement.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = payload;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('Webhook error: MIDTRANS_SERVER_KEY is not configured on the server.');
      return NextResponse.json({ error: 'Webhook processing not configured' }, { status: 503 });
    }

    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 403 });
    }

    let isSuccess = false;
    let isFailed = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        isSuccess = true;
      }
    } else if (transaction_status === 'settlement') {
      isSuccess = true;
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      isFailed = true;
    }

    if (isSuccess) {
      try {
        const order = await prisma.coinOrder.findUnique({
          where: { id: order_id },
        });

        if (order && order.status !== 'PAID') {
          await prisma.$transaction([
            prisma.coinOrder.update({
              where: { id: order_id },
              data: {
                status: 'PAID',
                paymentType: payment_type || 'qris',
              },
            }),
            ...(order.userId
              ? [
                  prisma.user.update({
                    where: { id: order.userId },
                    data: { coins: { increment: order.coins } },
                  }),
                  prisma.coinTransaction.create({
                    data: {
                      userId: order.userId,
                      type: 'TOPUP',
                      amount: order.coins,
                      description: `Coin Top Up via Midtrans (${order_id})`,
                    },
                  }),
                ]
              : []),
          ]);
        }
      } catch (dbErr) {
        console.warn('Prisma webhook update skipped/error:', dbErr);
      }
    } else if (isFailed) {
      try {
        await prisma.coinOrder.update({
          where: { id: order_id },
          data: {
            status: transaction_status === 'expire' ? 'EXPIRED' : 'FAILED',
            paymentType: payment_type || undefined,
          },
        });
      } catch (dbErr) {
        console.warn('Prisma webhook fail update skipped:', dbErr);
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Failed to handle Midtrans webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
