import { logger } from 'utilities/src/logger/logger'
import type { FetchClient } from '../base/types'
import {
  type BlockaidScanJsonRpcRequest,
  type BlockaidScanSiteRequest,
  type BlockaidScanSiteResponse,
  type BlockaidScanTransactionRequest,
  type BlockaidScanTransactionResponse,
  DappVerificationStatus,
  getBlockaidScanSiteResponseSchema,
  getBlockaidScanTransactionResponseSchema,
} from './types'

export interface BlockaidApiClient {
  scanSite: (url: string) => Promise<DappVerificationStatus>
  /** Returns null for an absent request or schema-invalid response; rejects request and timeout failures. */
  scanTransaction: (request: BlockaidScanTransactionRequest | null) => Promise<BlockaidScanTransactionResponse | null>
  /** Returns null for an absent request or schema-invalid response; rejects request and timeout failures. */
  scanJsonRpc: (request: BlockaidScanJsonRpcRequest | null) => Promise<BlockaidScanTransactionResponse | null>
}

export const BLOCKAID_API_PATHS = {
  scanSite: '/v0/site/scan',
  scanTransaction: '/v0/evm/transaction/scan',
  scanJsonRpc: '/v0/evm/json-rpc/scan',
}

// Timeout for Blockaid API requests (5 seconds)
const BLOCKAID_TIMEOUT_MS = 5000

type BlockaidScanFunction = 'scanJsonRpc' | 'scanTransaction'

function logAndRethrowBlockaidScanError({
  error,
  functionName,
  extra,
}: {
  error: unknown
  functionName: BlockaidScanFunction
  extra: Record<string, unknown>
}): never {
  logger.error(error, {
    tags: { file: 'createBlockaidApiClient', function: functionName },
    extra,
  })

  // Execution-scan consumers distinguish rejected transports from resolved, unusable responses.
  // Preserve every rejection so confirmation remains blocked with accurate failure telemetry.
  throw error
}

/**
 * Maps a Blockaid API response to a DappVerificationStatus
 * @param data The Blockaid API response
 * @returns The corresponding DappVerificationStatus
 */
function mapBlockaidResponseToStatus(data: BlockaidScanSiteResponse): DappVerificationStatus {
  if (data.status === 'miss') {
    return DappVerificationStatus.Unverified
  }
  return data.is_malicious ? DappVerificationStatus.Threat : DappVerificationStatus.Verified
}

export function createBlockaidApiClient(ctx: { fetchClient: FetchClient }): BlockaidApiClient {
  async function scanSite(url: string): Promise<DappVerificationStatus> {
    const requestBody: BlockaidScanSiteRequest = { url }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), BLOCKAID_TIMEOUT_MS)

    try {
      const result = await ctx.fetchClient.post(BLOCKAID_API_PATHS.scanSite, {
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      })

      const response = getBlockaidScanSiteResponseSchema().safeParse(result)
      if (!response.success) {
        logger.error(new Error('Blockaid API response schema validation failed'), {
          tags: { file: 'createBlockaidApiClient', function: 'scanSite' },
          extra: {
            url,
            validationError: response.error.message,
            receivedData: result,
          },
        })
        return DappVerificationStatus.Unverified
      }
      return mapBlockaidResponseToStatus(response.data)
    } catch (error) {
      // Log for observability but return safe default
      logger.error(error, {
        tags: {
          file: 'createBlockaidApiClient',
          function: 'scanSite',
        },
        extra: { url },
      })
      return DappVerificationStatus.Unverified
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function scanTransaction(
    request: BlockaidScanTransactionRequest | null,
  ): Promise<BlockaidScanTransactionResponse | null> {
    if (!request) {
      return null
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), BLOCKAID_TIMEOUT_MS)

    try {
      const result = await ctx.fetchClient.post(BLOCKAID_API_PATHS.scanTransaction, {
        body: JSON.stringify(request),
        signal: abortController.signal,
      })

      const response = getBlockaidScanTransactionResponseSchema().safeParse(result)
      if (!response.success) {
        logger.error(new Error('Blockaid API response schema validation failed'), {
          tags: { file: 'createBlockaidApiClient', function: 'scanTransaction' },
          extra: {
            chain: request.chain,
            account: request.account_address,
            domain: request.metadata.domain,
            validationError: response.error.message,
            receivedData: result,
          },
        })
        return null
      }
      return response.data
    } catch (error) {
      return logAndRethrowBlockaidScanError({
        error,
        functionName: 'scanTransaction',
        extra: { chain: request.chain, account: request.account_address, domain: request.metadata.domain },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function scanJsonRpc(
    request: BlockaidScanJsonRpcRequest | null,
  ): Promise<BlockaidScanTransactionResponse | null> {
    if (!request) {
      return null
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), BLOCKAID_TIMEOUT_MS)

    try {
      const result = await ctx.fetchClient.post(BLOCKAID_API_PATHS.scanJsonRpc, {
        body: JSON.stringify(request),
        signal: abortController.signal,
      })

      const response = getBlockaidScanTransactionResponseSchema().safeParse(result)
      if (!response.success) {
        logger.error(new Error('Blockaid API response schema validation failed'), {
          tags: { file: 'createBlockaidApiClient', function: 'scanJsonRpc' },
          extra: {
            chain: request.chain,
            account: request.account_address,
            domain: request.metadata.domain,
            method: request.data.method,
            validationError: response.error.message,
            receivedData: result,
          },
        })
        return null
      }
      return response.data
    } catch (error) {
      return logAndRethrowBlockaidScanError({
        error,
        functionName: 'scanJsonRpc',
        extra: {
          chain: request.chain,
          account: request.account_address,
          domain: request.metadata.domain,
          method: request.data.method,
        },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    scanSite,
    scanTransaction,
    scanJsonRpc,
  }
}
