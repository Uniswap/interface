import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionLiquidityLock } from '~/features/Toucan/Auction/hooks/useAuctionLiquidityLock'
import {
  AuctionDetails,
  AuctionLiquidityLockInfo,
  AuctionLockMode,
  BidTokenInfo,
} from '~/features/Toucan/Auction/store/types'
import { formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'

const mockUseStatsBannerData = vi.fn()
const mockStoreState = {
  auctionDetails: null as AuctionDetails | null,
  currentBlockNumber: undefined as number | undefined,
}

vi.mock('~/features/Toucan/Auction/hooks/useStatsBannerData', () => ({
  useStatsBannerData: () => mockUseStatsBannerData(),
}))

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: number) => `$${value}`,
  }),
}))

const UNLOCK_TIMESTAMP = 1798761600n

vi.mock('~/hooks/useBlockTimestamp', () => ({
  useBlockTimestamp: ({ blockNumber }: { blockNumber: number | undefined }) =>
    blockNumber === undefined ? undefined : UNLOCK_TIMESTAMP,
}))

const CHAIN_ID = 1
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'
const LOCK_RECIPIENT = '0x0000000000000000000000000000000000000003'
const LP_OPERATOR = '0x0000000000000000000000000000000000000004'
const FEE_RECIPIENT = '0x0000000000000000000000000000000000000005'
const POOL_OWNER = '0x0000000000000000000000000000000000000006'

// 1.25M tokens with 18 decimals
const BURNED_RAW = (1250000n * 10n ** 18n).toString()

const bidTokenInfo: BidTokenInfo = {
  symbol: 'ETH',
  decimals: 18,
  priceFiat: 3000,
  isStablecoin: false,
  logoUrl: null,
}

const token: CurrencyInfo = {
  currency: new Token(CHAIN_ID, TOKEN_ADDRESS, 18, 'TCAN', 'Toucan'),
  currencyId: `${CHAIN_ID}-${TOKEN_ADDRESS}`,
  logoUrl: null,
} as CurrencyInfo

function buildAuctionDetails({
  liquidityLock,
  poolOwner,
}: {
  liquidityLock?: AuctionLiquidityLockInfo
  poolOwner?: string
} = {}): AuctionDetails {
  return {
    auctionId: 'auction-1',
    chainId: CHAIN_ID,
    address: '0x0000000000000000000000000000000000000002',
    tokenAddress: TOKEN_ADDRESS,
    tokenSymbol: 'TCAN',
    token,
    liquidityLock,
    poolOwner,
  } as unknown as AuctionDetails
}

function mockStatsBanner(overrides: { clearingPriceDecimal?: number; bidTokenInfo?: BidTokenInfo | undefined } = {}) {
  mockUseStatsBannerData.mockReturnValue({
    clearingPriceDecimal: 0.05,
    bidTokenInfo,
    ...overrides,
  })
}

describe('useAuctionLiquidityLock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStatsBanner()
    mockStoreState.auctionDetails = null
    mockStoreState.currentBlockNumber = undefined
  })

  it('returns not-locked defaults when the auction has no lock info', () => {
    mockStoreState.auctionDetails = buildAuctionDetails()

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(false)
    expect(result.current.isPermanentlyLocked).toBe(false)
    expect(result.current.lockMode).toBeUndefined()
    expect(result.current.isBuybackEnabled).toBe(false)
    expect(result.current.isFeesForwarder).toBe(false)
    expect(result.current.unlockDateFormatted).toBeUndefined()
    expect(result.current.lpOwner).toBeUndefined()
    expect(result.current.feeRecipient).toBeUndefined()
    expect(result.current.hasBurnedTokens).toBe(false)
    expect(result.current.burnedAmountFormatted).toBeUndefined()
    expect(result.current.burnedUsdFormatted).toBeUndefined()
  })

  it('returns not-locked defaults when auction details have not loaded', () => {
    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(false)
    expect(result.current.lpOwner).toBeUndefined()
  })

  it('falls back to the pool owner as LP owner when not locked', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({ poolOwner: POOL_OWNER })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(false)
    expect(result.current.lpOwner).toBe(POOL_OWNER)
  })

  it('derives timelock state: operator as LP owner and estimated unlock date', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      poolOwner: POOL_OWNER,
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 1,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.isPermanentlyLocked).toBe(false)
    expect(result.current.lockMode).toBe(AuctionLockMode.Timelock)
    expect(result.current.isBuybackEnabled).toBe(false)
    expect(result.current.lpOwner).toBe(LP_OPERATOR)
    expect(result.current.unlockTimestamp).toBe(UNLOCK_TIMESTAMP)
    expect(result.current.unlockDateFormatted).toBe(formatTimestampToDate(UNLOCK_TIMESTAMP))
  })

  it('reads an expired timelock as never-locked', () => {
    mockStoreState.currentBlockNumber = 40000001
    mockStoreState.auctionDetails = buildAuctionDetails({
      poolOwner: POOL_OWNER,
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 1,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    // Lock-status indicators clear: no unlock date, LP owner falls back to the pool owner
    expect(result.current.isLocked).toBe(false)
    expect(result.current.isBuybackEnabled).toBe(false)
    expect(result.current.isFeesForwarder).toBe(false)
    expect(result.current.unlockTimestamp).toBeUndefined()
    expect(result.current.unlockDateFormatted).toBeUndefined()
    expect(result.current.lpOwner).toBe(POOL_OWNER)
  })

  it('keeps the buyback-burn stat and pill after the lock expires', () => {
    mockStoreState.currentBlockNumber = 40000001
    mockStoreState.auctionDetails = buildAuctionDetails({
      poolOwner: POOL_OWNER,
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 3,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
        totalTokensBurned: BURNED_RAW,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    // Lock-status indicators clear on expiry...
    expect(result.current.isLocked).toBe(false)
    expect(result.current.unlockDateFormatted).toBeUndefined()
    expect(result.current.lpOwner).toBe(POOL_OWNER)
    // ...but buyback & burn is a permanent characteristic and must persist
    expect(result.current.isBuybackEnabled).toBe(true)
    expect(result.current.hasBurnedTokens).toBe(true)
    expect(result.current.burnedAmountFormatted).toBe('1.25M TCAN')
    expect(result.current.burnedUsdFormatted).toBe('$187500000')
  })

  it('shows no buyback stat for a never-locked auction', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({ poolOwner: POOL_OWNER })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isBuybackEnabled).toBe(false)
    expect(result.current.hasBurnedTokens).toBe(false)
    expect(result.current.burnedAmountFormatted).toBeUndefined()
  })

  it('stays locked when the unlock block has not been reached yet', () => {
    mockStoreState.currentBlockNumber = 39999999
    mockStoreState.auctionDetails = buildAuctionDetails({
      poolOwner: POOL_OWNER,
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 1,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockMode).toBe(AuctionLockMode.Timelock)
    expect(result.current.lpOwner).toBe(LP_OPERATOR)
    expect(result.current.unlockDateFormatted).toBe(formatTimestampToDate(UNLOCK_TIMESTAMP))
  })

  it('keeps a permanent lock locked regardless of the current block', () => {
    mockStoreState.currentBlockNumber = 260000000001
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 1,
        unlockBlock: '260000000000',
        lpOperator: LP_OPERATOR,
        lockedForever: true,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.isPermanentlyLocked).toBe(true)
    expect(result.current.lockMode).toBe(AuctionLockMode.Timelock)
    expect(result.current.lpOwner).toBe(LP_OPERATOR)
  })

  it('stays locked while the current block is still loading (no flash-off)', () => {
    mockStoreState.currentBlockNumber = undefined
    mockStoreState.auctionDetails = buildAuctionDetails({
      poolOwner: POOL_OWNER,
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 1,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockMode).toBe(AuctionLockMode.Timelock)
    expect(result.current.lpOwner).toBe(LP_OPERATOR)
  })

  it('reads a burn lock as permanently locked with no unlock date or LP owner', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      poolOwner: POOL_OWNER,
      liquidityLock: {
        lockRecipient: '0x000000000000000000000000000000000000dEaD',
        lockMode: 4,
        // Burn rows serve unlock_block = 0 — it must never feed the block-timestamp estimator
        unlockBlock: '0',
        lpOperator: '',
        lockedForever: true,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.isPermanentlyLocked).toBe(true)
    expect(result.current.lockMode).toBe(AuctionLockMode.Burn)
    expect(result.current.unlockTimestamp).toBeUndefined()
    expect(result.current.unlockDateFormatted).toBeUndefined()
    // No operator for burn — the "LP owner" cell stays hidden
    expect(result.current.lpOwner).toBeUndefined()
    expect(result.current.isBuybackEnabled).toBe(false)
    expect(result.current.isFeesForwarder).toBe(false)
  })

  it('reads a legacy max-int timelock served with lockedForever as permanently locked', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 1,
        unlockBlock: '260000000000',
        lpOperator: LP_OPERATOR,
        lockedForever: true,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.isPermanentlyLocked).toBe(true)
    expect(result.current.lockMode).toBe(AuctionLockMode.Timelock)
    // The far-future unlock block is ignored — "Forever" replaces the estimated date
    expect(result.current.unlockTimestamp).toBeUndefined()
    expect(result.current.unlockDateFormatted).toBeUndefined()
    expect(result.current.lpOwner).toBe(LP_OPERATOR)
  })

  it('derives buyback-burn state with token and USD amounts at current price', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 3,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
        totalTokensBurned: BURNED_RAW,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isBuybackEnabled).toBe(true)
    expect(result.current.hasBurnedTokens).toBe(true)
    expect(result.current.burnedAmountFormatted).toBe('1.25M TCAN')
    // 1.25M tokens x 0.05 ETH x $3000 = $187,500,000
    expect(result.current.burnedUsdFormatted).toBe('$187500000')
  })

  it('renders the zero state when buyback is enabled but nothing has burned yet', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 3,
        unlockBlock: '40000000',
        lpOperator: LP_OPERATOR,
        totalTokensBurned: '0',
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isBuybackEnabled).toBe(true)
    expect(result.current.hasBurnedTokens).toBe(false)
    expect(result.current.burnedAmountFormatted).toBe('0 TCAN')
  })

  it('treats a missing burned total as the zero state', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 3,
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.hasBurnedTokens).toBe(false)
    expect(result.current.burnedAmountFormatted).toBe('0 TCAN')
  })

  it('omits the USD figure when no fiat price is available', () => {
    mockStatsBanner({ bidTokenInfo: { ...bidTokenInfo, priceFiat: 0 } })
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 3,
        lpOperator: LP_OPERATOR,
        totalTokensBurned: BURNED_RAW,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.burnedAmountFormatted).toBe('1.25M TCAN')
    expect(result.current.burnedUsdFormatted).toBeUndefined()
  })

  it('exposes the fee recipient in fees-forwarder mode only', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 2,
        lpOperator: LP_OPERATOR,
        feeRecipient: FEE_RECIPIENT,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isFeesForwarder).toBe(true)
    expect(result.current.feeRecipient).toBe(FEE_RECIPIENT)
    expect(result.current.isBuybackEnabled).toBe(false)
  })

  it.each([
    ['BUYBACK_BURN', AuctionLockMode.BuybackBurn],
    ['LOCK_MODE_BUYBACK_BURN', AuctionLockMode.BuybackBurn],
    ['LOCK_MODE_TIMELOCK', AuctionLockMode.Timelock],
    ['FEES_FORWARDER', AuctionLockMode.FeesForwarder],
    [2, AuctionLockMode.FeesForwarder],
    ['LOCK_MODE_BURN', AuctionLockMode.Burn],
    ['BURN', AuctionLockMode.Burn],
    [4, AuctionLockMode.Burn],
  ])('normalizes wire lock mode %s', (wireValue, expected) => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: wireValue,
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.lockMode).toBe(expected)
  })

  it('stays locked with an undefined mode for an unrecognized wire value', () => {
    mockStoreState.auctionDetails = buildAuctionDetails({
      liquidityLock: {
        lockRecipient: LOCK_RECIPIENT,
        lockMode: 99,
        lpOperator: LP_OPERATOR,
      },
    })

    const { result } = renderHook(() => useAuctionLiquidityLock())

    expect(result.current.isLocked).toBe(true)
    expect(result.current.lockMode).toBeUndefined()
    expect(result.current.isBuybackEnabled).toBe(false)
    expect(result.current.lpOwner).toBe(LP_OPERATOR)
  })
})
