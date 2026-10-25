import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

export type StorageConfig = {
  S3_BUCKET: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  // Omit for AWS; set for S3-compatible servers such as RustFS (http://localhost:9000).
  S3_ENDPOINT?: string;
};

export type StoredObject = {
  body: ReadableStream<Uint8Array>;
  contentType?: string;
  contentLength?: number;
};

/** Thin S3 wrapper for the app's private bucket. Objects are never public; serve them via the app. */
export function createStorage(env: StorageConfig) {
  const bucket = env.S3_BUCKET;
  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    // S3-compatible servers usually lack virtual-host bucket DNS.
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  // Creates the bucket on first write, so a fresh dev server works without manual setup.
  let bucketReady: Promise<void> | undefined;
  function ensureBucket() {
    bucketReady ??= (async () => {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        if (!(error instanceof S3ServiceException) || error.$metadata.httpStatusCode !== 404) {
          throw error;
        }
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    })().catch((error) => {
      bucketReady = undefined;
      throw error;
    });
    return bucketReady;
  }

  return {
    async put(key: string, body: Uint8Array, contentType: string) {
      await ensureBucket();
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },

    /** Returns the object's stream, or `null` when the key does not exist. */
    async get(key: string): Promise<StoredObject | null> {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!result.Body) return null;
        return {
          body: result.Body.transformToWebStream() as ReadableStream<Uint8Array>,
          contentType: result.ContentType,
          contentLength: result.ContentLength,
        };
      } catch (error) {
        if (error instanceof NoSuchKey) return null;
        throw error;
      }
    },

    /** Deletes the given keys; missing keys are not an error. */
    async delete(...keys: string[]) {
      if (keys.length === 0) return;
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    },
  };
}

export type Storage = ReturnType<typeof createStorage>;
