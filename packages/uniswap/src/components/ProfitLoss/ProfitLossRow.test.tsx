import { Text } from 'react-native'
import { ProfitLossRow } from 'uniswap/src/components/ProfitLoss/ProfitLossRow'
import { renderWithProviders } from 'uniswap/src/test/render'

vi.mock('uniswap/src/components/AnimatedNumber/AnimatedNumber', () => ({
  default: ({ value }: { value?: string }): JSX.Element => <Text>{value}</Text>,
}))

describe('ProfitLossRow', () => {
  it('formats regular values with two decimals', () => {
    const { getByText } = renderWithProviders(<ProfitLossRow label="Average cost" value={1234.5} />)
    expect(getByText('$1,234.50')).toBeTruthy()
  })

  it('uses subscript notation for sub-cent values instead of rounding to $0.00', () => {
    const { getByText } = renderWithProviders(<ProfitLossRow label="Average cost" value={0.000052} />)
    expect(getByText('$0.0₄52')).toBeTruthy()
  })

  it('keeps plain decimals for sub-cent values with few leading zeros', () => {
    const { getByText } = renderWithProviders(<ProfitLossRow label="Average cost" value={0.0006376} />)
    expect(getByText('$0.0006376')).toBeTruthy()
  })

  it('drops the sign so the arrow conveys direction', () => {
    const { getByText } = renderWithProviders(<ProfitLossRow showArrow label="Unrealized" value={-0.000052} />)
    expect(getByText('$0.0₄52')).toBeTruthy()
  })

  it('still renders exactly zero as $0.00', () => {
    const { getByText } = renderWithProviders(<ProfitLossRow label="Average cost" value={0} />)
    expect(getByText('$0.00')).toBeTruthy()
  })

  it('renders a dust-level residual (e.g. unrealized return on an effectively-zero balance) as $0.00, not subscript', () => {
    const { getByText, queryByText } = renderWithProviders(
      <ProfitLossRow showArrow label="Unrealized return" value={0.0000000000292} percent={10.03} />,
    )
    expect(getByText('$0.00')).toBeTruthy()
    expect(queryByText(/0\.0₁/)).toBeFalsy()
    expect(queryByText(/10\.03/)).toBeFalsy()
  })

  it('does not apply the dust floor to Average cost, which keeps subscript notation below the dust threshold', () => {
    const { getByText, queryByText } = renderWithProviders(<ProfitLossRow label="Average cost" value={0.0000005} />)
    expect(getByText('$0.0₆50')).toBeTruthy()
    expect(queryByText('$0.00')).toBeFalsy()
  })
})
