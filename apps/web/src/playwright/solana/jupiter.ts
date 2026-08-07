// oxlint-disable-next-line no-restricted-imports -- Playwright mock helpers need Playwright's Page type
import type { Page } from '@playwright/test'
import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'

/**
 * Mocks for the Jupiter Ultra API proxy used by Solana swaps (SWAP-2293).
 *
 * The client (`packages/api/src/clients/jupiter/createJupiterApiClient.ts`) hits
 * `${jupiterProxyUrl}/ultra/v1`: GET /order for quotes and POST /execute to submit the signed
 * transaction. Jupiter swaps do not go through the Trading API or the plan saga
 * (`planStepTypeToTradingRoute` rejects Routing.JUPITER), so mocking these two endpoints plus the
 * Solana RPC balance lookups fully isolates the flow.
 */

/** base58-encoded 64-byte signature returned by the mocked /execute endpoint. */
export const MOCK_JUPITER_SIGNATURE =
  '99eUso3aSbE9tqGSTXzo3TLfKb9RkMTURrHKQ1K7Zh3BbeqPevr5E1iCbpTjqHuTFLtfxTTD5ekfVuZFzQyEQf8'

function isJupiterUltraPath(url: URL, endpoint: 'order' | 'execute'): boolean {
  return url.pathname.endsWith(`/ultra/v1/${endpoint}`)
}

/**
 * Builds a real (unsigned) v0 `VersionedTransaction` so the client-side
 * `VersionedTransaction.deserialize` in the swap saga succeeds. The instruction content is
 * irrelevant — the transaction is only round-tripped through the mock wallet's identity signer and
 * posted back to the mocked /execute endpoint.
 */
export function buildUnsignedSolanaTransactionBase64(payerAddress: string): string {
  const payer = new PublicKey(payerAddress)
  const message = new TransactionMessage({
    payerKey: payer,
    // Any 32-byte base58 string is a structurally valid blockhash for a never-broadcast tx.
    recentBlockhash: payer.toBase58(),
    instructions: [SystemProgram.transfer({ fromPubkey: payer, toPubkey: payer, lamports: 1 })],
  }).compileToV0Message()

  return Buffer.from(new VersionedTransaction(message).serialize()).toString('base64')
}

export type JupiterOrderMockOptions = {
  /** Raw outAmount returned for every quote (swapMode ExactIn). */
  outAmount: string
  slippageBps?: number
  priceImpactPct?: string
}

export type JupiterOrderMockRecord = {
  /** Query params of every GET /order request, in arrival order. */
  requests: Record<string, string>[]
  /**
   * requestId of every successful order response, in served order. Quote polling continues
   * through review/submission, so assert membership rather than equality with the newest id.
   */
  requestIds: string[]
  /** When set, /order responds with this HTTP status (and an error body) instead of a quote. */
  failWithHttpStatus: number | undefined
}

/**
 * Serves a deterministic Jupiter order (quote) for any GET /order request, echoing the requested
 * mints/amount so the swap form recognizes the pair it asked about. Includes an unsigned
 * transaction whenever the request carries a taker, matching the real API's behavior for connected
 * wallets. Mutate `record.failWithHttpStatus` to toggle failure mode mid-test.
 */
export async function installJupiterOrderMock(
  page: Page,
  options: JupiterOrderMockOptions,
): Promise<JupiterOrderMockRecord> {
  const record: JupiterOrderMockRecord = { requests: [], requestIds: [], failWithHttpStatus: undefined }
  const slippageBps = options.slippageBps ?? 50
  let orderCounter = 0

  await page.route(
    (url: URL): boolean => isJupiterUltraPath(url, 'order'),
    async (route) => {
      const url = new URL(route.request().url())
      const params = Object.fromEntries(url.searchParams.entries())
      record.requests.push(params)

      if (record.failWithHttpStatus !== undefined) {
        await route.fulfill({
          status: record.failWithHttpStatus,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'jupiter-e2e forced order failure' }),
        })
        return
      }

      const { inputMint, outputMint, amount } = params
      // Read via URLSearchParams.get so the type reflects that taker is absent for view-only quotes.
      const taker = url.searchParams.get('taker')
      const requestId = `jupiter-e2e-order-${++orderCounter}`
      record.requestIds.push(requestId)

      // otherAmountThreshold = outAmount less slippage (ExactIn).
      const otherAmountThreshold = ((BigInt(options.outAmount) * BigInt(10_000 - slippageBps)) / 10_000n).toString()

      const response = {
        inputMint,
        outputMint,
        inAmount: amount,
        outAmount: options.outAmount,
        otherAmountThreshold,
        swapMode: 'ExactIn',
        slippageBps,
        priceImpactPct: options.priceImpactPct ?? '0.0001',
        routePlan: [{ swapInfo: { ammKey: 'jupiter-e2e-amm', label: 'MockAMM', inputMint, outputMint }, percent: 100 }],
        platformFee: { feeBps: 0 },
        feeMint: outputMint,
        prioritizationFeeLamports: 5000,
        router: 'iris',
        transaction: taker ? buildUnsignedSolanaTransactionBase64(taker) : null,
        gasless: false,
        requestId,
        taker,
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    },
  )

  return record
}

export type JupiterExecuteMockOptions =
  | { result: 'success' }
  /** 200 response with status Failed + a Jupiter error code (e.g. -1000 "failed to land"). */
  | { result: 'failed'; code: number; error: string }

export type JupiterExecuteMockRecord = {
  /** Body of every POST /execute request, in arrival order. */
  requests: { signedTransaction: string; requestId: string }[]
}

export async function installJupiterExecuteMock(
  page: Page,
  options: JupiterExecuteMockOptions,
): Promise<JupiterExecuteMockRecord> {
  const record: JupiterExecuteMockRecord = { requests: [] }

  await page.route(
    (url: URL): boolean => isJupiterUltraPath(url, 'execute'),
    async (route) => {
      const body = route.request().postDataJSON() as { signedTransaction: string; requestId: string }
      record.requests.push(body)

      const response =
        options.result === 'success'
          ? { status: 'Success', signature: MOCK_JUPITER_SIGNATURE, code: 0 }
          : { status: 'Failed', signature: null, code: options.code, error: options.error }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    },
  )

  return record
}
