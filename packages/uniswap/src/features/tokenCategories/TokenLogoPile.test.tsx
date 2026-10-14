import { TokenLogoPile } from 'uniswap/src/features/tokenCategories/TokenLogoPile'
import type { TokenCategoryPileLogo } from 'uniswap/src/features/tokenCategories/types'
import { render } from 'uniswap/src/test/test-utils'

function makeLogo(symbol: string, logoUrl = `https://logos.test/${symbol}.png`): TokenCategoryPileLogo {
  return { key: symbol, name: symbol, symbol, logoUrl }
}

describe('TokenLogoPile', () => {
  it('renders a single logo', () => {
    const { getAllByTestId } = render(<TokenLogoPile size={20} logos={[makeLogo('UNI')]} />)
    expect(getAllByTestId('token-logo')).toHaveLength(1)
  })

  it('renders two logos', () => {
    const { getAllByTestId } = render(<TokenLogoPile size={20} logos={[makeLogo('UNI'), makeLogo('ETH')]} />)
    expect(getAllByTestId('token-logo')).toHaveLength(2)
  })

  it('caps rendering at three logos', () => {
    const logos = [makeLogo('UNI'), makeLogo('ETH'), makeLogo('USDC'), makeLogo('WBTC')]
    const { getAllByTestId } = render(<TokenLogoPile size={20} logos={logos} />)
    expect(getAllByTestId('token-logo')).toHaveLength(3)
  })

  it('falls back to the symbol letters when a logo url is missing', () => {
    const { queryByText } = render(<TokenLogoPile size={20} logos={[makeLogo('UNI', '')]} />)
    expect(queryByText('UNI')).not.toBeNull()
  })
})
