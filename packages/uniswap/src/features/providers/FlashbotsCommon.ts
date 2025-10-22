import { Signer } from '@ethersproject/abstract-signer'
import { HexString } from 'utilities/src/addresses/hex'
import { sleep } from 'utilities/src/time/timing'
import { z } from 'zod'

// Common Flashbots constants
export const FLASHBOTS_RPC_URL = 'https://rpc.flashbots.net/fast?originId=uniswapwallet'
export const FLASHBOTS_DEFAULT_REFUND_PERCENT = 50 // Default for fast mode
export const FLASHBOTS_SIGNATURE_HEADER = 'X-Flashbots-Signature'
export const DEFAULT_FLASHBOTS_ENABLED = true
export const DEFAULT_FLASHBOTS_BLOCK_RANGE = 10

// Polling constants
export const POLL_INTERVAL_MS = 4000
export const MAX_ATTEMPTS = (25 * 12000) / POLL_INTERVAL_MS // 25 blocks of 12 seconds, queried every 4 seconds

/**
 * Interface representing the structure of the response from Flashbots API.
 * @see {@link https://protect.flashbots.net/tx/docs}
 */
export const FlashbotsReceiptSchema = z.object({
  status: z.enum(['UNKNOWN', 'PENDING', 'INCLUDED', 'FAILED', 'CANCELLED']),
  hash: z.string(),
  maxBlockNumber: z.number(),
  transaction: z.object({
    from: z.string(),
    to: z.string(),
    gasLimit: z.union([z.string(), z.number()]).transform((val) => String(val)),
    maxFeePerGas: z.string(),
    maxPriorityFeePerGas: z.string(),
    nonce: z.union([z.string(), z.number()]).transform((val) => String(val)),
    value: z.string(),
  }),
  fastMode: z.boolean(),
  seenInMempool: z.boolean(),
  simError: z.string().optional(),
})

export type FlashbotsReceipt = z.infer<typeof FlashbotsReceiptSchema>

// Common types for ethers and viem signers
export type SignerInfo = {
  signer: Signer
  address: string
}
/**
 * Builds a Flashbots URL with the appropriate parameters
 */
export function buildFlashbotsUrl({
  baseUrl = FLASHBOTS_RPC_URL,
  address,
  refundPercent,
}: {
  baseUrl?: string
  address?: HexString | string | undefined
  refundPercent?: number
}): string {
  const refundParam = getRefundString(address, refundPercent)
  const blockRangeParam = `&blockRange=${DEFAULT_FLASHBOTS_BLOCK_RANGE}`
  return `${baseUrl}${refundParam}${blockRangeParam}`
}

/**
 * Helper function to create the refund string for Flashbots URL
 */
function getRefundString(address?: string, refundPercent?: number): string {
  if (!address || !refundPercent || refundPercent < 0 || refundPercent > 100) {
    return ''
  }
  return `&refund=${address}:${refundPercent}`
}

/**
 * Waits for a Flashbots Protect transaction receipt by polling the Flashbots Protect API until a final status is reached or we reach the max attempts.
 * @param hash - The transaction hash to wait for.
 * @returns A promise that resolves to the final status of the transaction.
 * @throws Will throw an error if the polling exceeds the max attempts or if there is an issue fetching the transaction status.
 */
export async function waitForFlashbotsProtectReceipt(hash: string): Promise<FlashbotsReceipt> {
  const url = `https://protect.flashbots.net/tx/${hash}`
  let attempt = 0

  while (true) {
    if (attempt >= MAX_ATTEMPTS) {
      throw new Error(`Polling Flashbots Protect API for transaction ${hash} reached maximum ${MAX_ATTEMPTS} attempts`)
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate the response
      const receipt = FlashbotsReceiptSchema.parse(data)
      if (receipt.status !== 'PENDING') {
        return receipt
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid response structure from Flashbots API: ${error}`)
      }
      throw error
    }

    // Wait for POLL_INTERVAL_MS milliseconds before the next check
    await sleep(POLL_INTERVAL_MS)
    attempt++
  }
}
