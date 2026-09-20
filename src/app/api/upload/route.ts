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
import { getSessionUser } from '../../../lib/auth/session';

const ALLOWED_FOLDERS = ['uploads', 'covers', 'editor', 'avatars'];

export async function POST(request: Request) {
  try {
    // 1. Enforce authentication on all uploads
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in to upload files.' },
        { status: 401 }
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
      .replace(/['"]/g, '')
      .trim()
      .toLowerCase();

    const isAdminUser =
      session.role === 'admin' ||
      (Boolean(adminEmail) && session.email.toLowerCase() === adminEmail);

    const contentType = request.headers.get('content-type') || '';

    // Direct file upload via FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const rawFolder = (formData.get('folder') as string) || 'uploads';
      const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'uploads';

      // Only admins can upload to covers or editor
      if ((folder === 'covers' || folder === 'editor') && !isAdminUser) {
        return NextResponse.json(
          { error: 'Forbidden. Only administrators can upload to this folder.' },
          { status: 403 }
        );
      }

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

      // Generate sanitized, timestamped key
      const ext = file.name.split('.').pop() || 'webp';
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\.[^.]+$/, '').slice(0, 50);
      const key = `${folder}/${safeName}-${timestamp}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadToR2(key, buffer, file.type);

      return NextResponse.json({ url, key });
    }

    // Presigned URL generation
    const body = await request.json();
    const { key: rawKey, contentType: fileContentType } = body;

    if (!rawKey || !fileContentType) {
      return NextResponse.json(
        { error: 'key and contentType are required' },
        { status: 400 }
      );
    }

    // Validate contentType
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(fileContentType)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }

    // Iterative path sanitization against directory traversal
    let cleanKey = String(rawKey).replace(/\\/g, '/');
    while (cleanKey.includes('..')) {
      cleanKey = cleanKey.replace(/\.\./g, '');
    }
    cleanKey = cleanKey.replace(/^\/+/, '').replace(/\/+/g, '/');

    const parts = cleanKey.split('/');
    const folderPrefix = parts[0];
    if (!ALLOWED_FOLDERS.includes(folderPrefix) || parts.length < 2) {
      return NextResponse.json(
        { error: `Invalid folder in key. Must start with one of: ${ALLOWED_FOLDERS.join(', ')}` },
        { status: 400 }
      );
    }

    if ((folderPrefix === 'covers' || folderPrefix === 'editor') && !isAdminUser) {
      return NextResponse.json(
        { error: 'Forbidden. Only administrators can upload to this folder.' },
        { status: 403 }
      );
    }

    // Append timestamp to avoid arbitrary overwrite
    const rawFileName = parts.slice(1).join('_');
    const ext = rawFileName.split('.').pop() || 'webp';
    const safeBaseName = rawFileName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\.[^.]+$/, '').slice(0, 50);
    const safeKey = `${folderPrefix}/${safeBaseName}-${Date.now()}.${ext}`;

    const presignedUrl = await getUploadPresignedUrl(safeKey, fileContentType);

    return NextResponse.json({ presignedUrl, key: safeKey, publicUrl: `${process.env.R2_PUBLIC_URL}/${safeKey}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
