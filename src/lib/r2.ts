/**
 * Cloudflare R2 client — S3-compatible object storage.
 * Used for cover images, illustrations, editor images, and avatars.
 * 
 * This module is SERVER-ONLY. Never import in client components.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 environment variables are not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured');
  return bucket;
}

function getPublicUrl(): string {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error('R2_PUBLIC_URL is not configured');
  return url;
}

/**
 * Generate a presigned URL for client-side upload.
 * Expires in 10 minutes.
 */
export async function getUploadPresignedUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn: 600 });
}

/**
 * Upload a buffer directly from server-side (API route).
 */
export async function uploadToR2(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  await getR2Client().send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return `${getPublicUrl()}/${key}`;
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  }));
}

/**
 * Construct the public URL for a given R2 key.
 */
export function getR2PublicUrl(key: string): string {
  return `${getPublicUrl()}/${key}`;
}
