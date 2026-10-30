import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { TickMath } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { PositionTokenBreakdown } from 'src/screens/PositionDetailsScreen/components/PositionTokenBreakdown'
import { render, screen } from 'src/test/test-utils'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useExtractedTokenColor: () => ({ tokenColor: '#123456', tokenColorLoading: false }),
}))

vi.mock('uniswap/src/components/CurrencyLogo/CurrencyLogo', () => ({
  CurrencyLogo: () => null,
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    formatPercent: (value: number) => `${Math.round(value)}%`,
    formatCurrencyAmount: ({ value }: { value?: { toExact: () => string } }) => value?.toExact() ?? '',
  }),
}))

const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ETH', 'Ether')
const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DAI', 'Dai')

describe('PositionTokenBreakdown', () => {
  it('renders the label, value, amounts, and a 50/50 split derived from price', () => {
    // 1 token0 is worth 2000 token1
    const token0Price = new Price(token0, token1, 1, 2000)
    const amount0 = CurrencyAmount.fromRawAmount(token0, '1000000000000000000') // 1 token0 -> 2000 token1 of value
    const amount1 = CurrencyAmount.fromRawAmount(token1, '2000000000000000000000') // 2000 token1

    render(
      <PositionTokenBreakdown
        amount0={amount0}
        amount1={amount1}
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$4,000.00"
        label="Your position"
        token0Price={token0Price}
      />,
    )

    expect(screen.getByText('Your position')).toBeDefined()
    expect(screen.getByText('$4,000.00')).toBeDefined()
    expect(screen.getAllByText('50%')).toHaveLength(2)
    expect(screen.getByText('1 ETH')).toBeDefined()
    expect(screen.getByText('2000 DAI')).toBeDefined()
  })

  it('omits the split when no price is available but still shows amounts', () => {
    const amount0 = CurrencyAmount.fromRawAmount(token0, '1000000000000000000')
    const amount1 = CurrencyAmount.fromRawAmount(token1, '2000000000000000000000')

    render(
      <PositionTokenBreakdown
        amount0={amount0}
        amount1={amount1}
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$4,000.00"
        label="Your position"
        token0Price={undefined}
      />,
    )

    expect(screen.queryAllByText('50%')).toHaveLength(0)
    expect(screen.getByText('1 ETH')).toBeDefined()
    expect(screen.getByText('2000 DAI')).toBeDefined()
  })

  // A pool row served with its price pinned to the bottom of the tick range makes token0 worth
  // ~1e-39 raw token1 units, so a position holding only token0 is worth a positive fraction of a
  // single raw token1 unit. Splitting on `.quotient` truncated that to 0/0 and Percent.toFixed threw
  // "[big.js] Division by zero", which the try/catch turned into a silently missing split.
  // Values are from the wallet on LP-1564: V4 tokenId 1039089, Base ETH/USDC.
  it('splits a position worth less than one raw unit of token1', () => {
    const baseUsdc = new Token(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin')
    const degeneratePool = new V4Pool(
      nativeOnChain(8453),
      baseUsdc,
      30,
      1,
      ZERO_ADDRESS,
      TickMath.getSqrtRatioAtTick(TickMath.MIN_TICK),
      '0',
      TickMath.MIN_TICK,
    )
    const dustPosition = new V4Position({
      pool: degeneratePool,
      liquidity: '612822055934',
      tickLower: -198100,
      tickUpper: -195750,
    })

    render(
      <PositionTokenBreakdown
        amount0={dustPosition.amount0}
        amount1={dustPosition.amount1}
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$0.00"
        label="Your position"
        token0Price={degeneratePool.token0Price}
      />,
    )

    // Below tickLower the position is entirely token0.
    expect(screen.getByText('100%')).toBeDefined()
    expect(screen.getByText('0%')).toBeDefined()
  })

  it('collapses to just the label and value when amounts are omitted (e.g. closed position)', () => {
    render(
      <PositionTokenBreakdown
        currency0Info={undefined}
        currency1Info={undefined}
        formattedValue="$0.00"
        label="Your position"
      />,
    )

    expect(screen.getByText('Your position')).toBeDefined()
    expect(screen.getByText('$0.00')).toBeDefined()
    expect(screen.queryAllByText('50%')).toHaveLength(0)
    expect(screen.queryByText('1 ETH')).toBeNull()
    expect(screen.queryByText('2000 DAI')).toBeNull()
  })
})
