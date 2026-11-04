import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Position as LiquidityServicePosition } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96, FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import JSBI from 'jsbi'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDC_BNB } from 'uniswap/src/constants/tokens'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { parseLiquidityServicePosition } from 'uniswap/src/features/positions/parseLiquidityServicePosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useAccount } from '~/connection/hooks/useAccount'
import { useNativeTokenPercentageBufferExperiment } from '~/features/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment'
import { useDerivedIncreaseLiquidityInfo } from '~/pages/IncreaseLiquidity/hooks/useDerivedIncreaseLiquidityInfo'
import { renderHook } from '~/test-utils/render'
import { PositionField } from '~/types/position'

// USDC is 6 decimals on Ethereum but 18 on BNB Chain. An existing BNB USDC position must keep the
// 18-decimal deployment from the positions response all the way to the increase request amounts.

vi.mock('~/connection/hooks/useAccount', () => ({ useAccount: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment', () => ({
  useNativeTokenPercentageBufferExperiment: vi.fn(),
}))
vi.mock('uniswap/src/features/portfolio/api', async (importOriginal) => ({
  ...(await importOriginal()),
  useOnChainCurrencyBalance: vi.fn(),
}))
vi.mock('uniswap/src/features/gas/hooks/useMaxAmountSpend', async (importOriginal) => ({
  ...(await importOriginal()),
  useMaxAmountSpend: vi.fn(),
}))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', async (importOriginal) => ({
  ...(await importOriginal()),
  useUSDCValue: vi.fn(),
}))

const WALLET = '0x0000000000000000000000000000000000000123'
const POOL_ID = '0x' + 'ab'.repeat(32)
const BNB_PRICE_IN_USDC = 600
const ONE_E18 = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
// Raw onchain pool state at 1 BNB = 600 USDC, both legs 18 decimals.
const SQRT_PRICE_X96 = encodeSqrtRatioX96(JSBI.multiply(ONE_E18, JSBI.BigInt(BNB_PRICE_IN_USDC)), ONE_E18)
const TICK_SPACING = TICK_SPACINGS[FeeAmount.MEDIUM]

/** A V4 BNB/USDC position on BNB Chain as the liquidity service serves it. */
function bnbUsdcPosition(): PositionInfo {
  const parsed = parseLiquidityServicePosition({
    chainId: UniverseChainId.Bnb,
    owner: WALLET,
    version: Protocols.V4,
    poolAddressOrId: POOL_ID,
    tokenId: '1',
    feeTier: FeeAmount.MEDIUM,
    tickSpacing: TICK_SPACING,
    tickLower: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING),
    tickUpper: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING),
    liquidity: '1000000000000000000000',
    token0Address: ZERO_ADDRESS,
    token1Address: USDC_BNB.address,
    token0Metadata: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    token1Metadata: { symbol: 'USDC', name: 'USD Coin', decimals: USDC_BNB.decimals },
    currentTick: TickMath.getTickAtSqrtRatio(SQRT_PRICE_X96),
    sqrtPriceX96: SQRT_PRICE_X96.toString(),
    poolLiquidity: '1000000000000000000000',
    hookAddress: ZERO_ADDRESS,
    // 2.5 USDC of fees, raw at 18 decimals.
    token1UncollectedFees: '2500000000000000000',
  } as unknown as LiquidityServicePosition)
  if (!parsed) {
    throw new Error('fixture did not parse')
  }
  return parsed
}

describe('LP increase with BNB USDC (18 decimals)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAccount).mockReturnValue({ address: WALLET } as unknown as ReturnType<typeof useAccount>)
    vi.mocked(useNativeTokenPercentageBufferExperiment).mockReturnValue(1)
    // Raw onchain balances, 10 BNB and 10,000 USDC, both 18 decimals.
    vi.mocked(useOnChainCurrencyBalance).mockImplementation((currency) => ({
      balance: currency
        ? CurrencyAmount.fromRawAmount(currency, JSBI.multiply(JSBI.BigInt(currency.isNative ? 10 : 10_000), ONE_E18))
        : undefined,
      isLoading: false,
      error: null,
    }))
    vi.mocked(useMaxAmountSpend).mockImplementation(({ currencyAmount }) => currencyAmount ?? undefined)
    vi.mocked(useUSDCValue).mockReturnValue(null)
  })

  it('parses the position with the 18-decimal USDC deployment and scales its amounts by it', () => {
    const position = bnbUsdcPosition()

    const usdc = position.currency1Amount.currency
    expect(usdc.chainId).toBe(UniverseChainId.Bnb)
    expect(usdc.isToken && usdc.address).toBe(USDC_BNB.address)
    expect(usdc.decimals).toBe(18)
    expect(position.fee1Amount?.toExact()).toBe('2.5')
    // Full range at 600 USDC/BNB: the USDC leg is worth ~600x the BNB leg.
    const ratio = Number(position.currency1Amount.toExact()) / Number(position.currency0Amount.toExact())
    expect(ratio).toBeCloseTo(BNB_PRICE_IN_USDC, 3)
  })

  it('sends a typed USDC deposit at 18 decimals with the matching BNB amount', () => {
    const { result } = renderHook(() =>
      useDerivedIncreaseLiquidityInfo({
        state: { position: bnbUsdcPosition(), exactField: PositionField.TOKEN1, exactAmount: '600' },
        unwrapNativeCurrency: false,
      }),
    )

    // These quotients are the amounts IncreaseLiquidityTxContext puts on the increase request.
    const { currencyAmounts, currencyBalances, error } = result.current
    expect(currencyAmounts?.[PositionField.TOKEN1]?.quotient.toString()).toBe('600000000000000000000')
    expect(Number(currencyAmounts?.[PositionField.TOKEN0]?.quotient.toString()) / 1e18).toBeCloseTo(1, 6)
    expect(currencyBalances?.[PositionField.TOKEN1]?.toExact()).toBe('10000')
    expect(error).toBeUndefined()
  })
})
