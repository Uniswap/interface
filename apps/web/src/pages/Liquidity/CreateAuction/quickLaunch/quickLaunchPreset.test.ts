import { PriceRangeStrategy as ProtoPriceRangeStrategy } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { QUICK_LAUNCH_DURATION_SECONDS } from '@uniswap/liquidity-launcher-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { zeroAddress } from '~/chains'
import { buildCreateAuctionRequest } from '~/pages/Liquidity/CreateAuction/buildCreateAuctionRequest'
import {
  applyQuickLaunchAuctionWindow,
  applyQuickLaunchPoolPreset,
  getQuickLaunchAuctionWindow,
  getQuickLaunchFloorPricePerToken,
  QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN,
  QUICK_LAUNCH_START_LEAD_MINUTES,
} from '~/pages/Liquidity/CreateAuction/quickLaunch/quickLaunchPreset'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import {
  EmissionScheduleError,
  getAuctionEmissionScheduleError,
} from '~/pages/Liquidity/CreateAuction/utils/emissionSchedule'

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
  actions.setFloorPrice(
    getQuickLaunchFloorPricePerToken(options?.raiseUsdPrice !== undefined ? options.raiseUsdPrice : 2500),
  )
  return store
}

describe('getQuickLaunchFloorPricePerToken', () => {
  it('anchors the $5k FDV floor to the raise USD price', () => {
    // $5k / 1B tokens = $0.000005/token; at $2500/ETH that is 2e-9 ETH/token
    expect(getQuickLaunchFloorPricePerToken(2500)).toBe('0.000000002')
    expect(getQuickLaunchFloorPricePerToken(4000)).toBe('0.00000000125')
  })

  it('falls back to a fixed ETH floor when the oracle is unresolved', () => {
    expect(getQuickLaunchFloorPricePerToken(null)).toBe(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN)
    expect(getQuickLaunchFloorPricePerToken(0)).toBe(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN)
  })
})

describe('getQuickLaunchAuctionWindow', () => {
  it('starts after the 1-minute quick-launch lead and runs for the fixed 4h window', () => {
    const now = new Date('2026-07-08T12:00:00Z')
    const { startTime, endTime } = getQuickLaunchAuctionWindow(now)
    expect(startTime.getTime() - now.getTime()).toBe(QUICK_LAUNCH_START_LEAD_MINUTES * 60 * 1000)
    expect(QUICK_LAUNCH_START_LEAD_MINUTES).toBe(1)
    expect(endTime.getTime() - startTime.getTime()).toBe(QUICK_LAUNCH_DURATION_MS)
    // The SDK is the single source of truth for the 4h window.
    expect(QUICK_LAUNCH_DURATION_SECONDS).toBe(14_400)
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

  it('produces a valid emission schedule on supported chains for the 4h window', () => {
    const now = new Date()
    const { startTime, endTime } = getQuickLaunchAuctionWindow(now)
    for (const chainId of [
      UniverseChainId.Mainnet,
      UniverseChainId.Base,
      UniverseChainId.Unichain,
      UniverseChainId.Sepolia,
    ]) {
      expect(getAuctionEmissionScheduleError({ startTime, endTime, chainId, nowMs: now.getTime() })).not.toBe(
        EmissionScheduleError.WindowTooShort,
      )
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
    })

    expect(request).toBeDefined()

    // Factory-minted new token with the hard-coded 1B supply (18 decimals)
    expect(request?.tokenInfo?.source?.case).toBe('newToken')
    if (request?.tokenInfo?.source?.case === 'newToken') {
      expect(request.tokenInfo.source.value.symbol).toBe('QUICK')
      expect(request.tokenInfo.source.value.totalSupply).toBe(`1${'0'.repeat(27)}`)
      expect(request.tokenInfo.source.value.metadata?.description).toBe('one line of lore')
    }

    // ETH/native raise, fixed 4h window, $5k-FDV floor
    expect(request?.auction?.currencyAddress).toBe(zeroAddress)
    const start = request?.auction?.startTimeUnix ?? 0n
    const end = request?.auction?.endTimeUnix ?? 0n
    expect(Number(end - start)).toBe(QUICK_LAUNCH_DURATION_SECONDS)
    expect(request?.auction?.floorPriceRaisePerToken).toBe('0.000000002')
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
    })

    expect(request).toBeDefined()
    expect(request?.chainId).toBe(UniverseChainId.Sepolia)
    expect(request?.auction?.floorPriceRaisePerToken).toBe(QUICK_LAUNCH_FALLBACK_FLOOR_ETH_PER_TOKEN)
    expect(request?.pool?.liquidityLock?.mode?.case).toBe('buybackBurn')
  })
})
