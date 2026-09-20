/**
 * API Route: POST /api/auth/register
 * Legacy endpoint — Malaz Scans uses 1-click Google & GitHub OAuth.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Please use 1-click registration via Google or GitHub.' },
    { status: 400 }
  );
}
