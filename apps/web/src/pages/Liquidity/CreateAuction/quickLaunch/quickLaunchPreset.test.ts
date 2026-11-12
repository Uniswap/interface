import { PriceRangeStrategy as ProtoPriceRangeStrategy } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { QUICK_LAUNCH_DURATION_SECONDS } from '@uniswap/liquidity-launcher-sdk'
import { UniverseChainId } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'
import { zeroAddress } from '~/chains'
import { QUICK_LAUNCH_DURATION_HOURS } from '~/constants/tokenLaunch'
import { buildCreateAuctionRequest } from '~/pages/Liquidity/CreateAuction/buildCreateAuctionRequest'
import {
  applyQuickLaunchAuctionWindow,
  applyQuickLaunchPoolPreset,
  getQuickLaunchAuctionWindow,
  getQuickLaunchFloorPricePerToken,
  getQuickLaunchGraduationPricePerToken,
  QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN,
  QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN,
  QUICK_LAUNCH_START_LEAD_MINUTES,
} from '~/pages/Liquidity/CreateAuction/quickLaunch/quickLaunchPreset'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { getAuctionEmissionScheduleError } from '~/pages/Liquidity/CreateAuction/utils/emissionSchedule'

const WALLET = '0x1111111111111111111111111111111111111111'
const SALT = `0x${'22'.repeat(32)}`
const QUICK_LAUNCH_DURATION_MS = QUICK_LAUNCH_DURATION_SECONDS * 1000

function buildPresetStore(options?: {
  network?: UniverseChainId
  raiseUsdPrice?: number | null
}): ReturnType<typeof createCreateAuctionStore> {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.updateCreateNewTokenField('name', 'QUICK')
  actions.updateCreateNewTokenField('symbol', 'QUICK')
  actions.updateCreateNewTokenField('description', 'one line of lore')
  if (options?.network !== undefined) {
    actions.updateCreateNewTokenField('network', options.network)
  }
  applyQuickLaunchPoolPreset(actions)
  actions.commitTokenFormAndAdvance()
  const { startTime, endTime } = getQuickLaunchAuctionWindow(new Date('2026-07-08T12:00:00Z'))
  actions.setStartTime(startTime)
  actions.setEndTime(endTime)
  const raiseUsdPrice = options?.raiseUsdPrice !== undefined ? options.raiseUsdPrice : 2500
  actions.setFloorPrice(getQuickLaunchFloorPricePerToken(raiseUsdPrice))
  actions.setGraduationPrice(getQuickLaunchGraduationPricePerToken(raiseUsdPrice))
  return store
}

describe('getQuickLaunchFloorPricePerToken', () => {
  it('anchors the $1k FDV floor to the raise USD price', () => {
    // $1k / 1B tokens = $0.000001/token; at $2500/ETH that is 4e-10 ETH/token
    expect(getQuickLaunchFloorPricePerToken(2500)).toBe('0.0000000004')
    expect(getQuickLaunchFloorPricePerToken(4000)).toBe('0.00000000025')
  })

  it('falls back to a fixed ETH floor when the oracle is unresolved (null price), without logging', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    expect(getQuickLaunchFloorPricePerToken(null)).toBe(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('falls back and logs a warning on a degraded/invalid price', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    expect(getQuickLaunchFloorPricePerToken(0)).toBe(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})

describe('getQuickLaunchGraduationPricePerToken', () => {
  it('anchors the $10k FDV graduation price to the raise USD price — 10x the floor', () => {
    // $10k / 1B tokens = $0.00001/token; at $2500/ETH that is 4e-9 ETH/token
    expect(getQuickLaunchGraduationPricePerToken(2500)).toBe('0.000000004')
    expect(getQuickLaunchGraduationPricePerToken(4000)).toBe('0.0000000025')
  })

  it('falls back to a fixed ETH graduation price when the oracle is unresolved, above the floor fallback', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    // Null price = pre-resolution, no warning; an invalid price = degraded feed, logs a warning.
    expect(getQuickLaunchGraduationPricePerToken(null)).toBe(QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN)
    expect(warn).not.toHaveBeenCalled()
    expect(getQuickLaunchGraduationPricePerToken(0)).toBe(QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(Number(QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN)).toBeGreaterThan(
      Number(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN),
    )
    warn.mockRestore()
  })
})

describe('getQuickLaunchAuctionWindow', () => {
  it('starts after the 1-minute quick-launch lead and runs for the fixed 1h window', () => {
    const now = new Date('2026-07-08T12:00:00Z')
    const { startTime, endTime } = getQuickLaunchAuctionWindow(now)
    expect(startTime.getTime() - now.getTime()).toBe(QUICK_LAUNCH_START_LEAD_MINUTES * 60 * 1000)
    expect(QUICK_LAUNCH_START_LEAD_MINUTES).toBe(1)
    expect(endTime.getTime() - startTime.getTime()).toBe(QUICK_LAUNCH_DURATION_MS)
    // The SDK is the single source of truth for the window; the literal is deliberately not derived.
    expect(QUICK_LAUNCH_DURATION_SECONDS).toBe(3_600)
    expect(QUICK_LAUNCH_DURATION_HOURS).toBe(1)
  })

  it('writes the derived window into the store via applyQuickLaunchAuctionWindow', () => {
    vi.useFakeTimers()
    try {
      const now = new Date('2026-07-08T12:00:00Z')
      vi.setSystemTime(now)
      const store = createCreateAuctionStore()
      applyQuickLaunchAuctionWindow(store.getState().actions)
      const { startTime, endTime } = store.getState().configureAuction
      expect(startTime?.getTime()).toBe(now.getTime() + QUICK_LAUNCH_START_LEAD_MINUTES * 60 * 1000)
      expect((endTime?.getTime() ?? 0) - (startTime?.getTime() ?? 0)).toBe(QUICK_LAUNCH_DURATION_MS)
    } finally {
      vi.useRealTimers()
    }
  })

  it('produces a valid emission schedule on supported chains for the 1h window', () => {
    const now = new Date()
    const { startTime, endTime } = getQuickLaunchAuctionWindow(now)
    for (const chainId of [
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.Unichain,
      UniverseChainId.Sepolia,
    ]) {
      expect(getAuctionEmissionScheduleError({ startTime, endTime, chainId, nowMs: now.getTime() })).toBeUndefined()
    }
  })
})

describe('quick-launch preset -> CreateAuctionRequest', () => {
  it('builds the exact request the standard create flow would submit', () => {
    const store = buildPresetStore()
    const { tokenForm, configureAuction, customizePool } = store.getState()

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction,
      customizePool,
      walletAddress: WALLET,
      currencyAddress: zeroAddress,
      salt: SALT,
      isQuickLaunch: true,
    })

    expect(request).toBeDefined()

    // Factory-minted new token with the hard-coded 1B supply (18 decimals)
    expect(request?.tokenInfo?.source?.case).toBe('newToken')
    if (request?.tokenInfo?.source?.case === 'newToken') {
      expect(request.tokenInfo.source.value.symbol).toBe('QUICK')
      expect(request.tokenInfo.source.value.totalSupply).toBe(`1${'0'.repeat(27)}`)
      expect(request.tokenInfo.source.value.metadata?.description).toBe('one line of lore')
    }

    // ETH/native raise, fixed 1h window, $1k-FDV floor, decoupled $10k-FDV graduation price
    expect(request?.auction?.currencyAddress).toBe(zeroAddress)
    const start = request?.auction?.startTimeUnix ?? 0n
    const end = request?.auction?.endTimeUnix ?? 0n
    expect(Number(end - start)).toBe(QUICK_LAUNCH_DURATION_SECONDS)
    expect(request?.auction?.floorPriceRaisePerToken).toBe('0.0000000004')
    expect(request?.auction?.graduationPriceRaisePerToken).toBe('0.000000004')
    // No validation hook: the doc's mandated-price / bracket hook does not exist on-chain
    expect(request?.auction?.validationHook).toBeUndefined()

    // Pool preset: wizard-default 0.3% fee, full range + concentrated, permanently timelocked buyback & burn
    expect(request?.pool?.fee).toBe(3000)
    expect(request?.pool?.priceRangeStrategy).toBe(ProtoPriceRangeStrategy.CONCENTRATED_FULL_RANGE)
    expect(request?.pool?.liquidityLock?.mode?.case).toBe('buybackBurn')
    const unlock = request?.pool?.liquidityLock?.unlockTimeUnix ?? 0n
    // Permanent preset = auction end + 100000 years of days
    expect(Number(unlock - end)).toBe(365 * 100000 * 86400)
  })

  it('builds a valid request on Ethereum Sepolia with the oracle-less floor fallback', () => {
    // Sepolia has no USD price feed, so the floor falls back to the fixed ETH value.
    const store = buildPresetStore({ network: UniverseChainId.Sepolia, raiseUsdPrice: null })
    const { tokenForm, configureAuction, customizePool } = store.getState()

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction,
      customizePool,
      walletAddress: WALLET,
      currencyAddress: zeroAddress,
      salt: SALT,
      isQuickLaunch: true,
    })

    expect(request).toBeDefined()
    expect(request?.chainId).toBe(UniverseChainId.Sepolia)
    expect(request?.auction?.floorPriceRaisePerToken).toBe(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN)
    expect(request?.auction?.graduationPriceRaisePerToken).toBe(QUICK_LAUNCH_FALLBACK_GRADUATION_ETH_PER_TOKEN)
    expect(request?.pool?.liquidityLock?.mode?.case).toBe('buybackBurn')
  })
})

describe('graduation price never leaks onto a manual auction', () => {
  // A quick-launch handoff pins configureAuction.graduationPrice. If the user then leaves
  // quick-launch mode and submits a manual auction, the decoupled graduation price (field 8)
  // must NOT be sent — the creator never chose it, cannot see it, and the auction is immutable.
  // Two independent guards, both asserted here: the store clears the pin on every exit path,
  // and the builder gates field 8 on isQuickLaunch.

  it('the store clears the graduation pin when quick launch is toggled off', () => {
    const store = buildPresetStore()
    expect(store.getState().configureAuction.graduationPrice).toBeDefined()

    store.getState().actions.setQuickLaunch(false)
    expect(store.getState().configureAuction.graduationPrice).toBeUndefined()
  })

  it('the store clears the graduation pin when the token mode changes', () => {
    const store = buildPresetStore()
    expect(store.getState().configureAuction.graduationPrice).toBeDefined()

    store.getState().actions.setTokenMode(TokenMode.EXISTING)
    expect(store.getState().configureAuction.graduationPrice).toBeUndefined()
  })

  it('the builder omits field 8 for a manual auction even if a stale pin survives', () => {
    // Defense in depth: force the leak condition (pin still set) and prove the isQuickLaunch=false
    // gate suppresses the field regardless of the store state.
    const store = buildPresetStore()
    const { tokenForm, configureAuction, customizePool } = store.getState()
    expect(configureAuction.graduationPrice).toBeDefined()

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction,
      customizePool,
      walletAddress: WALLET,
      currencyAddress: zeroAddress,
      salt: SALT,
      isQuickLaunch: false,
    })

    expect(request?.auction?.floorPriceRaisePerToken).toBeDefined()
    expect(request?.auction?.graduationPriceRaisePerToken).toBeUndefined()
  })
})
