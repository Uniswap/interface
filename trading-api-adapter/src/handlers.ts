/**
 * Framework-agnostic handlers for the Trading API endpoints the interface calls.
 * Each returns { status, body } so it can be mounted in Express (server.ts) or a Lambda.
 */

import { randomUUID } from 'crypto'
import { ethers } from 'ethers'
import { ChainConfig, getChain, isSupportedChain, resolveRpcUrl } from './chains'
import { createRoutingProvider } from './routingClient'
import { toTradingApiQuoteResponse } from './translate'
import {
  ApprovalRequest,
  ApprovalResponse,
  CreateSwapRequest,
  CreateSwapResponse,
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
        '(or ROUTING_MODE=embed to run the in-process SOR). See DEPLOY.md.',
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

// ---- POST /v1/indicative_quote --------------------------------------------
// The interface's `fetchIndicativeQuote` (createTradingApiClient.ts) is just a quote with
// routingPreference=FASTEST, and it consumes the SAME `DiscriminatedQuoteResponse` (=QuoteResponse)
// shape as `fetchQuote`. In this interface build it POSTs to /v1/quote, but the deployed client
// can also hit /v1/indicative_quote — so we serve it here with identical behavior (same real
// routing, same honest 404). No lighter/fabricated price: the indicative display reads
// quote.input.amount / quote.output.amount off this exact response.

export async function handleIndicativeQuote(req: QuoteRequest): Promise<HandlerResult> {
  return handleQuote(req)
}

// ---- POST /v1/swap ---------------------------------------------------------
// Takes the ClassicQuote /v1/quote just returned (echoed back by the client in `quote`) and
// re-quotes with a recipient set so the SOR also computes real Universal Router calldata
// (route.methodParameters). We never fabricate a tx — no route/methodParameters => 404.

export async function handleSwap(req: CreateSwapRequest): Promise<HandlerResult> {
  // Validate the request against the Trading API contract.
  if (!req || typeof req !== 'object') {
    return err(400, 'VALIDATION_ERROR', 'Request body must be a JSON CreateSwapRequest object.')
  }
  const quote = req.quote
  if (!quote || typeof quote !== 'object') {
    return err(400, 'VALIDATION_ERROR', '`quote` must be the ClassicQuote object returned by /v1/quote.')
  }
  if (typeof quote.chainId !== 'number') {
    return err(400, 'VALIDATION_ERROR', '`quote.chainId` is required.')
  }
  if (!quote.input?.token || !quote.output?.token) {
    return err(400, 'VALIDATION_ERROR', '`quote.input.token` and `quote.output.token` are required.')
  }
  if (quote.tradeType !== TradeType.EXACT_INPUT && quote.tradeType !== TradeType.EXACT_OUTPUT) {
    return err(400, 'VALIDATION_ERROR', '`quote.tradeType` must be EXACT_INPUT or EXACT_OUTPUT.')
  }
  if (!quote.swapper) {
    return err(400, 'VALIDATION_ERROR', '`quote.swapper` is required to build an executable swap transaction.')
  }
  if (!isSupportedChain(quote.chainId)) {
    return err(400, 'VALIDATION_ERROR', `Unsupported chainId ${quote.chainId}.`)
  }

  const chain = getChain(quote.chainId)!

  // No routing backend wired → honest 404 (NOT a fabricated transaction).
  if (routingProvider.mode === 'none') {
    return err(
      404,
      'NO_ROUTE_FOUND',
      'No routing backend configured. Set ROUTING_API_URL to a deployed HookSwap routing-api ' +
        '(or ROUTING_MODE=embed to run the in-process SOR). See DEPLOY.md.',
    )
  }

  const requestId = randomUUID()

  try {
    const routing = await routingProvider.quoteExactRoute({
      chain,
      tokenInAddress: quote.input.token,
      tokenOutAddress: quote.output.token,
      tradeType: quote.tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
      amount: String(quote.input.amount ?? quote.output.amount),
      protocols: chain.protocols,
      recipient: quote.swapper,
      slippageTolerancePct: quote.slippage ?? 0.5,
      deadlineSeconds: req.deadline,
    })

    if (!routing || !routing.methodParameters) {
      // No route (empty pools / no liquidity) or the SOR didn't build calldata → Trading-API-shaped
      // 404, matching handleQuote's honest-404 pattern. We NEVER fabricate calldata.
      return err(
        404,
        'NO_ROUTE_FOUND',
        `No executable route found for the requested swap on chain ${chain.chainId}. ` +
          'This is expected until on-chain liquidity exists in the HookSwap pools.',
      )
    }

    const body: CreateSwapResponse = {
      requestId,
      swap: {
        to: routing.methodParameters.to,
        from: quote.swapper,
        data: routing.methodParameters.calldata,
        value: routing.methodParameters.value,
        chainId: chain.chainId,
      },
    }

    return { status: 200, body }
  } catch (e) {
    return err(500, 'INTERNAL_ERROR', `Routing backend error: ${(e as Error).message}`)
  }
}

// ---- POST /v1/check_approval ----------------------------------------------
// Determines whether `walletAddress` must approve `token` to Permit2 before it can be swapped.
// HookSwap swaps route through the Universal Router, which pulls the input token via Permit2
// (canonical 0x0000…78BA3) — so the on-chain gate is the ERC20 allowance(walletAddress, permit2).
// We read that allowance for real (no fabrication). Response mirrors the Trading API
// ApprovalResponse the interface's useTokenApprovalInfo consumes:
//   - native input           → { approval: null, cancel: null }      (no ERC20 approval possible)
//   - allowance >= amount     → { approval: null, cancel: null }      (already approved)
//   - allowance <  amount     → { approval: <approve(permit2, MaxUint256) tx>, cancel: null }

/** Native sentinels the interface/Trading-API use for "the chain's native currency". */
const NATIVE_APPROVAL_SENTINELS = new Set([
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0x0000000000000000000000000000000000000000',
])

const ERC20_ALLOWANCE_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

/** One JsonRpcProvider per chain, reused across requests (avoids re-handshaking each call). */
const approvalProviders = new Map<number, ethers.providers.JsonRpcProvider>()
function getApprovalProvider(chain: ChainConfig): ethers.providers.JsonRpcProvider {
  let p = approvalProviders.get(chain.chainId)
  if (!p) {
    p = new ethers.providers.JsonRpcProvider(resolveRpcUrl(chain), chain.chainId)
    approvalProviders.set(chain.chainId, p)
  }
  return p
}

function noApprovalNeeded(requestId: string): HandlerResult<ApprovalResponse> {
  // Interface branches on `data.approval === null` → ApprovalAction.None (see useTokenApprovalInfo).
  return { status: 200, body: { requestId, approval: null, cancel: null } }
}

export async function handleCheckApproval(req: ApprovalRequest): Promise<HandlerResult> {
  // Validate the request against the Trading API contract.
  if (!req || typeof req !== 'object') {
    return err(400, 'VALIDATION_ERROR', 'Request body must be a JSON ApprovalRequest object.')
  }
  if (!req.walletAddress || !ethers.utils.isAddress(req.walletAddress)) {
    return err(400, 'VALIDATION_ERROR', '`walletAddress` must be a valid address.')
  }
  if (!req.token) {
    return err(400, 'VALIDATION_ERROR', '`token` is required.')
  }
  if (!req.amount || !/^\d+$/.test(String(req.amount))) {
    return err(400, 'VALIDATION_ERROR', '`amount` must be a positive base-unit integer string.')
  }
  if (!isSupportedChain(req.chainId)) {
    return err(400, 'VALIDATION_ERROR', `Unsupported chainId ${req.chainId}.`)
  }

  const chain = getChain(req.chainId)!
  const requestId = randomUUID()

  // Native currency can't be (and needn't be) approved — the router wraps it in-tx.
  if (NATIVE_APPROVAL_SENTINELS.has(req.token.toLowerCase())) {
    return noApprovalNeeded(requestId)
  }
  if (!ethers.utils.isAddress(req.token)) {
    return err(400, 'VALIDATION_ERROR', '`token` must be a valid ERC20 address or native sentinel.')
  }

  try {
    const provider = getApprovalProvider(chain)
    const erc20 = new ethers.Contract(req.token, ERC20_ALLOWANCE_ABI, provider)

    // REAL on-chain read: current ERC20 allowance granted by the wallet to Permit2.
    const allowance: ethers.BigNumber = await erc20.allowance(req.walletAddress, chain.permit2)
    const needed = ethers.BigNumber.from(String(req.amount))

    if (allowance.gte(needed)) {
      return noApprovalNeeded(requestId)
    }

    // Insufficient → return a real approve(permit2, MaxUint256) transaction for the wallet to sign.
    // MaxUint256 matches the Trading API default (approve max so future swaps need no re-approval).
    const data = erc20.interface.encodeFunctionData('approve', [chain.permit2, ethers.constants.MaxUint256])

    const body: ApprovalResponse = {
      requestId,
      approval: {
        to: req.token,
        from: req.walletAddress,
        data,
        value: '0',
        chainId: chain.chainId,
      },
      cancel: null,
    }
    return { status: 200, body }
  } catch (e) {
    return err(500, 'INTERNAL_ERROR', `Failed to read on-chain allowance: ${(e as Error).message}`)
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
  // wrapped-native token, plus any chain.seededTokens (real, verified metadata for tokens
  // in a seeded pool — e.g. Robinhood's tHOOK). A full swappable-token set requires a
  // token-list / indexer service — wire TOKEN_LIST_URL (per-chain) here when available
  // (TODO). We do NOT invent token metadata.
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
      ...(chain.seededTokens ?? []).map((token) => ({
        address: token.address,
        chainId: chain.chainId,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        project: {},
      })),
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
