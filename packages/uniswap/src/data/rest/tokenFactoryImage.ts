import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type { VerifyTokenFactoryImageResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { dataApiPostTransport } from 'uniswap/src/data/rest/base'

// Promise client (not a react-query hook): the token image flow is an imperative
// presign -> upload -> verify sequence driven from a mutation, not a render-time query.
const client = createPromiseClient(DataApiService, dataApiPostTransport)

/**
 * Mints a Pinata v3 signed upload URL for a token-factory image. The URL is short-lived and already
 * scopes the upload to the token-launcher group + network server-side.
 */
export async function createTokenFactoryPresignedUrl(fileName: string): Promise<string> {
  const { url } = await client.createTokenFactoryPresignedUrl({ fileName })
  return url
}

/**
 * Runs server-side moderation (Rekognition) on an already-uploaded CID. Resolves with the verdict;
 * the caller distinguishes APPROVED/BLOCKED via `status` and handles the transient "scan unavailable"
 * error (a `ConnectError`) with a retry.
 */
export function verifyTokenFactoryImage(cid: string): Promise<VerifyTokenFactoryImageResponse> {
  return client.verifyTokenFactoryImage({ cid })
}
