/**
 * API Route: POST /api/upload
 * Generates a presigned URL for client-side upload to R2.
 * OR accepts a direct file upload and stores it in R2.
 * 
 * Usage (presigned): POST { key: "covers/my-novel.webp", contentType: "image/webp" }
 * Usage (direct):    POST FormData with file field
 */

import { NextResponse } from 'next/server';
import { getUploadPresignedUrl, uploadToR2 } from '../../../lib/r2';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Direct file upload via FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'uploads';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Allowed: jpeg, png, webp, gif' }, { status: 400 });
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
      }

      // Generate key
      const ext = file.name.split('.').pop() || 'webp';
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '');
      const key = `${folder}/${safeName}-${timestamp}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadToR2(key, buffer, file.type);

      return NextResponse.json({ url, key });
    }

    // Presigned URL generation
    const body = await request.json();
    const { key, contentType: fileContentType } = body;

    if (!key || !fileContentType) {
      return NextResponse.json(
        { error: 'key and contentType are required' },
        { status: 400 }
      );
    }

    const presignedUrl = await getUploadPresignedUrl(key, fileContentType);

    return NextResponse.json({ presignedUrl, key, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
