/**
 * API Route: POST /api/auth/login
 * Legacy endpoint — Malaz Scans uses 1-click Google & GitHub OAuth.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Silakan gunakan login 1-klik via Google atau GitHub.' },
    { status: 400 }
  );
}
