/**
 * Framework-agnostic handlers for the Trading API endpoints the interface calls.
 * Each returns { status, body } so it can be mounted in Express (server.ts) or a Lambda.
 */

import { randomUUID } from 'crypto'
import { getChain, isSupportedChain } from './chains'
import { createRoutingProvider } from './routingClient'
import { toTradingApiQuoteResponse } from './translate'
import {
  GetSwappableTokensResponse,
  QuoteRequest,
  TradeType,
  TradingApiError,
} from './tradingApiTypes'

export interface HandlerResult<T = unknown> {
  status: number
  body: T
}

const routingProvider = createRoutingProvider()

function err(status: number, errorCode: string, detail: string): HandlerResult<TradingApiError> {
  return { status, body: { errorCode, detail, id: randomUUID() } }
}

// ---- POST /v1/quote -------------------------------------------------------

export async function handleQuote(req: QuoteRequest): Promise<HandlerResult> {
  // Validate the request against the Trading API contract.
  if (!req || typeof req !== 'object') {
    return err(400, 'VALIDATION_ERROR', 'Request body must be a JSON QuoteRequest object.')
  }
  if (req.type !== TradeType.EXACT_INPUT && req.type !== TradeType.EXACT_OUTPUT) {
    return err(400, 'VALIDATION_ERROR', '`type` must be EXACT_INPUT or EXACT_OUTPUT.')
  }
  if (!req.amount || !/^\d+$/.test(String(req.amount))) {
    return err(400, 'VALIDATION_ERROR', '`amount` must be a positive base-unit integer string.')
  }
  if (!req.tokenIn || !req.tokenOut) {
    return err(400, 'VALIDATION_ERROR', '`tokenIn` and `tokenOut` are required.')
  }
  if (req.tokenInChainId !== req.tokenOutChainId) {
    // This adapter serves single-chain classic swaps only (no bridging).
    return err(400, 'VALIDATION_ERROR', 'Cross-chain (bridge) quotes are not supported by this adapter.')
  }
  if (!isSupportedChain(req.tokenInChainId)) {
    return err(400, 'VALIDATION_ERROR', `Unsupported chainId ${req.tokenInChainId}.`)
  }

  const chain = getChain(req.tokenInChainId)!

  // No routing backend wired → honest 404 (NOT a fabricated price).
  if (routingProvider.mode === 'none') {
    return err(
      404,
      'NO_ROUTE_FOUND',
      'No routing backend configured. Set ROUTING_API_URL to a deployed HookSwap routing-api ' +
        '(or ROUTING_MODE=embed once the in-process SOR is implemented). See DEPLOY.md.',
    )
  }

  const requestId = randomUUID()

  try {
    const routing = await routingProvider.quoteExactRoute({
      chain,
      tokenInAddress: req.tokenIn,
      tokenOutAddress: req.tokenOut,
      tradeType: req.type === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
      amount: String(req.amount),
      protocols: chain.protocols,
      recipient: req.recipient ?? req.swapper,
      slippageTolerancePct: req.slippageTolerance,
      deadlineSeconds: req.deadline,
    })

    if (!routing) {
      // No route (empty pools / no liquidity) → Trading-API-shaped 404, which the interface's
      // fetchQuote on404 path expects.
      return err(
        404,
        'NO_ROUTE_FOUND',
        `No route found for the requested swap on chain ${chain.chainId}. ` +
          'This is expected until on-chain liquidity exists in the HookSwap pools.',
      )
    }

    return { status: 200, body: toTradingApiQuoteResponse({ request: req, routing, requestId }) }
  } catch (e) {
    return err(500, 'INTERNAL_ERROR', `Routing backend error: ${(e as Error).message}`)
  }
}

// ---- GET /v1/swappable_tokens?tokenIn=&tokenInChainId= --------------------

export function handleSwappableTokens(params: {
  tokenIn?: string
  tokenInChainId?: string | number
}): HandlerResult {
  const chainId = Number(params.tokenInChainId)
  if (!params.tokenIn || !Number.isFinite(chainId)) {
    return err(400, 'VALIDATION_ERROR', '`tokenIn` and `tokenInChainId` query params are required.')
  }
  if (!isSupportedChain(chainId)) {
    return err(400, 'VALIDATION_ERROR', `Unsupported chainId ${chainId}.`)
  }

  const chain = getChain(chainId)!

  // We return only tokens whose metadata we know statically & truthfully: the chain's
  // wrapped-native token. A full swappable-token set requires a token-list / indexer service —
  // wire TOKEN_LIST_URL (per-chain) here when available (TODO). We do NOT invent token metadata.
  const response: GetSwappableTokensResponse = {
    requestId: randomUUID(),
    tokens: [
      {
        address: chain.wrappedNative.address,
        chainId: chain.chainId,
        name: chain.wrappedNative.name,
        symbol: chain.wrappedNative.symbol,
        decimals: chain.wrappedNative.decimals,
        project: {},
      },
    ],
  }
  return { status: 200, body: response }
}

// ---- GET /health ----------------------------------------------------------

export function handleHealth(): HandlerResult {
  return {
    status: 200,
    body: {
      status: 'ok',
      routingMode: routingProvider.mode,
      routingApiConfigured: Boolean(process.env.ROUTING_API_URL),
    },
  }
}
