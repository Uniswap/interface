import { isRawRealtimeTokenPriceMessage } from '@universe/prices/src/sources/websocket/messageParser'
import type { PriceKey } from '@universe/prices/src/types'
import { createPriceKey } from '@universe/prices/src/utils/tokenIdentifier'

/**
 * The realtime channel publishes each chain's ETH/USD rate under the zero
 * address; the joiner consumes that room as the join rate for ETH-leg tokens.
 */
export const REALTIME_RATE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'

/** A joined USD price tick produced by the realtime joiner. */
export interface RealtimePriceUpdate {
  chainId: number
  /** Lowercased. */
  tokenAddress: string
  priceUsd: number
  /** Present when the feed denominated this token in ETH. */
  priceEth?: number
  timestamp: number
}

export interface RealtimePriceJoiner {
  /**
   * Feed one raw websocket frame; returns the resulting USD updates.
   * Non-realtime frames return []. A rate tick can fan out to many tokens.
   */
  handleMessage: (raw: unknown) => RealtimePriceUpdate[]
}

interface HeldEthLeg {
  chainId: number
  tokenAddress: string
  priceEth: number
  timestamp: number
}

/** Empty string means the leg is absent; present legs are finite and > 0. */
function parsePriceLeg(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Stateful joiner for the realtime price channel: gates per-token message
 * order (delivery is unordered and at-least-once — the client is the
 * authoritative version gate) and joins ETH-denominated legs against the
 * chain's zero-address ETH/USD rate room at write time.
 *
 * Tokens whose messages carry a USD leg pass through directly. Tokens with
 * only an ETH leg are held until the chain's first rate tick, then emitted;
 * every subsequent rate tick re-emits all held legs at the new rate. The
 * zero-address rate itself is consumed internally, never emitted as a token
 * price.
 *
 * One instance per connection/stream; pure state, no I/O.
 */
export function createRealtimePriceJoiner(): RealtimePriceJoiner {
  const versionFloors = new Map<PriceKey, bigint>()
  const ethUsdRates = new Map<number, { rate: number; timestamp: number }>()
  const heldEthLegs = new Map<PriceKey, HeldEthLeg>()

  function passesVersionGate(key: PriceKey, version: string): boolean {
    let value: bigint
    try {
      value = BigInt(version)
    } catch {
      return false
    }
    const floor = versionFloors.get(key)
    if (floor !== undefined && value <= floor) {
      return false
    }
    versionFloors.set(key, value)
    return true
  }

  function handleRateTick(chainId: number, priceUsd: string | undefined, timestamp: number): RealtimePriceUpdate[] {
    const rate = parsePriceLeg(priceUsd)
    if (rate === undefined) {
      return []
    }
    ethUsdRates.set(chainId, { rate, timestamp })
    const updates: RealtimePriceUpdate[] = []
    for (const leg of heldEthLegs.values()) {
      if (leg.chainId === chainId) {
        updates.push({
          chainId,
          tokenAddress: leg.tokenAddress,
          priceUsd: leg.priceEth * rate,
          priceEth: leg.priceEth,
          timestamp,
        })
      }
    }
    return updates
  }

  function handleMessage(raw: unknown): RealtimePriceUpdate[] {
    if (!isRawRealtimeTokenPriceMessage(raw)) {
      return []
    }
    const { chainId, tokenAddress, priceUsd, priceEth, version } = raw.payload
    const key = createPriceKey(chainId, tokenAddress)
    if (!passesVersionGate(key, version)) {
      return []
    }
    // Unparseable envelope timestamps degrade to receipt time instead of NaN-poisoning cache freshness.
    const parsedTimestamp = new Date(raw.timestamp).getTime()
    const timestamp = Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now()

    const address = tokenAddress.toLowerCase()
    if (address === REALTIME_RATE_TOKEN_ADDRESS) {
      return handleRateTick(chainId, priceUsd, timestamp)
    }

    const usdLeg = parsePriceLeg(priceUsd)
    const ethLeg = parsePriceLeg(priceEth)
    if (ethLeg !== undefined) {
      heldEthLegs.set(key, { chainId, tokenAddress: address, priceEth: ethLeg, timestamp })
    }
    if (usdLeg !== undefined) {
      return [{ chainId, tokenAddress: address, priceUsd: usdLeg, priceEth: ethLeg, timestamp }]
    }
    if (ethLeg === undefined) {
      return []
    }
    const rate = ethUsdRates.get(chainId)
    if (!rate) {
      // Held; emitted when the chain's first rate tick arrives.
      return []
    }
    return [{ chainId, tokenAddress: address, priceUsd: ethLeg * rate.rate, priceEth: ethLeg, timestamp }]
  }

  return { handleMessage }
}
