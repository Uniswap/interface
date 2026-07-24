import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { PositionTokenBreakdown } from 'src/screens/PositionDetailsScreen/components/PositionTokenBreakdown'
import { render, screen } from 'src/test/test-utils'

vi.mock('ui/src/utils/colors/hooks/useExtractedTokenColor', () => ({
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
