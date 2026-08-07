import { isRawPoolPriceMessage } from '@universe/prices/src/sources/websocket/messageParser'

/** A joined USD price tick produced by the pool price joiner. */
export interface PoolPriceUpdate {
  chainId: number
  /** The pool's base (non-quote) side — the token being priced. Lowercased. */
  tokenAddress: string
  priceUsd: number
  /** Spot price of the base token denominated in the pool's quote token. */
  priceInQuote: number
  /** The pool's pinned quote token. Lowercased; may be the zero address (native). */
  quoteTokenAddress: string
  timestamp: number
}

export interface PoolPriceJoiner {
  /**
   * Feed one raw websocket frame; returns the resulting USD updates.
   * Non-pool frames, stale versions, and quote-less pools return [].
   * Ticks whose quote-USD rate isn't known yet are held and emitted by the
   * setQuoteUsd call that supplies the rate.
   */
  handleMessage: (raw: unknown) => PoolPriceUpdate[]
  /**
   * Supply/refresh a quote token's USD price (from the app's own price cache,
   * REST poll, or any other source). Re-emits every held/current leg quoted in
   * that token at the new rate so downstream USD stays in sync with the rate.
   */
  setQuoteUsd: (input: {
    chainId: number
    quoteTokenAddress: string
    priceUsd: number
    timestamp: number
  }) => PoolPriceUpdate[]
  /** Quote tokens (per chain) seen in pool frames but with no USD rate supplied yet. */
  getPendingQuotes: () => Array<{ chainId: number; quoteTokenAddress: string }>
}

interface HeldLeg {
  chainId: number
  tokenAddress: string
  priceInQuote: number
  quoteTokenAddress: string
  timestamp: number
}

/** Empty string means the leg is absent; present legs are finite and > 0. */
function parsePrice(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function rateKey(chainId: number, quoteTokenAddress: string): string {
  return `${chainId}-${quoteTokenAddress}`
}

/**
 * Stateful joiner for the per-pool spot-price channel (pool_price): gates
 * per-room message order (delivery is unordered and at-least-once — the
 * client is the authoritative version gate), picks the base-in-quote
 * orientation, and composes USD as priceInQuote × quoteUsd at write time.
 *
 * Emits for the pool's BASE side only (the non-quote token). Pools with no
 * pinned quote (empty quoteTokenAddress) are version-gated but never emitted —
 * there is no USD to compose; the REST fallback covers those tokens.
 *
 * One instance per connection/stream; pure state, no I/O — the quote-USD rate
 * is pushed in via setQuoteUsd by whatever source the app wires.
 */
export function createPoolPriceJoiner(): PoolPriceJoiner {
  const versionFloors = new Map<string, bigint>()
  const quoteUsdRates = new Map<string, { rate: number; timestamp: number }>()
  // One live leg per room: the latest base-side price awaiting/at the current rate.
  const legs = new Map<string, HeldLeg>()

  function passesVersionGate(roomKey: string, version: string): boolean {
    let value: bigint
    try {
      value = BigInt(version)
    } catch {
      return false
    }
    if (value <= BigInt(0)) {
      return false
    }
    const floor = versionFloors.get(roomKey)
    if (floor !== undefined && value <= floor) {
      return false
    }
    versionFloors.set(roomKey, value)
    return true
  }

  function toUpdate(leg: HeldLeg, rate: number, timestamp: number): PoolPriceUpdate {
    return {
      chainId: leg.chainId,
      tokenAddress: leg.tokenAddress,
      priceUsd: leg.priceInQuote * rate,
      priceInQuote: leg.priceInQuote,
      quoteTokenAddress: leg.quoteTokenAddress,
      timestamp,
    }
  }

  function handleMessage(raw: unknown): PoolPriceUpdate[] {
    if (!isRawPoolPriceMessage(raw)) {
      return []
    }
    const { chainId, protocolVersion, poolId, token0Address, token1Address, quoteTokenAddress, version } = raw.payload
    if (
      typeof chainId !== 'number' ||
      typeof poolId !== 'string' ||
      typeof token0Address !== 'string' ||
      typeof token1Address !== 'string' ||
      typeof quoteTokenAddress !== 'string' ||
      typeof version !== 'string'
    ) {
      return []
    }
    const roomKey = `${chainId}:${String(protocolVersion).toLowerCase()}:${poolId.toLowerCase()}`
    if (!passesVersionGate(roomKey, version)) {
      return []
    }
    const quote = quoteTokenAddress.toLowerCase()
    if (!quote) {
      // No pinned quote — nothing to price the base in; REST fallback covers.
      return []
    }
    const token0 = token0Address.toLowerCase()
    const token1 = token1Address.toLowerCase()
    const baseIsToken0 = quote === token1
    if (!baseIsToken0 && quote !== token0) {
      // Quote isn't a side of this pool — malformed; drop.
      return []
    }
    const priceInQuote = parsePrice(baseIsToken0 ? raw.payload.priceToken0InToken1 : raw.payload.priceToken1InToken0)
    if (priceInQuote === undefined) {
      return []
    }
    // Bucket-sensitive consumers (live candles) need the swap's block time,
    // not receipt time — prefer the payload timestamp over the envelope's.
    const parsedTimestamp = new Date(raw.payload.timestamp ?? raw.timestamp).getTime()
    const timestamp = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now()

    const leg: HeldLeg = {
      chainId,
      tokenAddress: baseIsToken0 ? token0 : token1,
      priceInQuote,
      quoteTokenAddress: quote,
      timestamp,
    }
    legs.set(roomKey, leg)
    const rate = quoteUsdRates.get(rateKey(chainId, quote))
    if (!rate) {
      // Held; emitted when the quote's first USD rate arrives via setQuoteUsd.
      return []
    }
    return [toUpdate(leg, rate.rate, timestamp)]
  }

  function setQuoteUsd(input: {
    chainId: number
    quoteTokenAddress: string
    priceUsd: number
    timestamp: number
  }): PoolPriceUpdate[] {
    const { chainId, priceUsd, timestamp } = input
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
      return []
    }
    const quote = input.quoteTokenAddress.toLowerCase()
    quoteUsdRates.set(rateKey(chainId, quote), { rate: priceUsd, timestamp })
    const updates: PoolPriceUpdate[] = []
    for (const leg of legs.values()) {
      if (leg.chainId === chainId && leg.quoteTokenAddress === quote) {
        // Rate refreshes re-emit at the rate's timestamp so cache freshness advances.
        updates.push(toUpdate(leg, priceUsd, Math.max(leg.timestamp, timestamp)))
      }
    }
    return updates
  }

  function getPendingQuotes(): Array<{ chainId: number; quoteTokenAddress: string }> {
    const pending = new Map<string, { chainId: number; quoteTokenAddress: string }>()
    for (const leg of legs.values()) {
      const key = rateKey(leg.chainId, leg.quoteTokenAddress)
      if (!quoteUsdRates.has(key) && !pending.has(key)) {
        pending.set(key, { chainId: leg.chainId, quoteTokenAddress: leg.quoteTokenAddress })
      }
    }
    return [...pending.values()]
  }

  return { handleMessage, setQuoteUsd, getPendingQuotes }
}
