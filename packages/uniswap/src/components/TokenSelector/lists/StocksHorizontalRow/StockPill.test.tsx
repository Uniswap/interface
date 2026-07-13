import { fireEvent } from '@testing-library/react-native'
import { OnchainItemListOptionType, type RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { StockPill } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StockPill'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

const option: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Bnb,
  address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

describe('StockPill', () => {
  it('renders the ticker and fires onSelectRwaToken on press', () => {
    const onSelect = vi.fn()
    const { getAllByText, getByTestId } = render(<StockPill option={option} onSelectRwaToken={onSelect} />)
    expect(getAllByText('GOOGLX').length).toBeGreaterThan(0)
    fireEvent.press(getByTestId('stock-option-56-GOOGLX'))
    expect(onSelect).toHaveBeenCalledWith(option)
  })
})
