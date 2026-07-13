import { fireEvent } from '@testing-library/react-native'
import { OnchainItemListOptionType, type RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { StocksHorizontalRow } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow.web'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

function makeStock(symbol: string): RwaTokenOption {
  return {
    type: OnchainItemListOptionType.Rwa,
    chainId: UniverseChainId.Bnb,
    address: `0x${symbol}`,
    symbol,
    name: `${symbol} name`,
  }
}

const sevenTokens: RwaTokenOption[] = ['AAPLX', 'GOOGLX', 'MSFTX', 'AMZNX', 'TSLAX', 'METAX', 'NVDAX'].map(makeStock)
const threeTokens: RwaTokenOption[] = ['AAPLX', 'GOOGLX', 'MSFTX'].map(makeStock)

function testIdFor(token: RwaTokenOption): string {
  return `stock-option-${token.chainId}-${token.symbol}`
}

describe('StocksHorizontalRow.web', () => {
  it('collapsed: shows 4 tiles + a 3+ expand control and fires onExpand with all tokens', () => {
    const onExpand = vi.fn()
    const { getByTestId, getByText, queryByTestId } = render(
      <StocksHorizontalRow tokens={sevenTokens} expanded={false} onSelectRwaToken={vi.fn()} onExpand={onExpand} />,
    )

    // First 4 tiles are visible
    sevenTokens.slice(0, 4).forEach((token) => {
      expect(getByTestId(testIdFor(token))).toBeDefined()
    })
    // The remaining tiles are not yet rendered
    sevenTokens.slice(4).forEach((token) => {
      expect(queryByTestId(testIdFor(token))).toBeNull()
    })

    const expandControl = getByText('3+')
    expect(expandControl).toBeDefined()

    fireEvent.press(expandControl)
    expect(onExpand).toHaveBeenCalledWith(sevenTokens)
  })

  it('expanded: shows all 7 tiles and no expand control', () => {
    const { getByTestId, queryByText } = render(
      <StocksHorizontalRow tokens={sevenTokens} expanded={true} onSelectRwaToken={vi.fn()} onExpand={vi.fn()} />,
    )

    sevenTokens.forEach((token) => {
      expect(getByTestId(testIdFor(token))).toBeDefined()
    })
    expect(queryByText('3+')).toBeNull()
    expect(queryByText('+')).toBeNull()
  })

  it('with <= 5 tokens: renders all tiles and no expand control', () => {
    const { getByTestId, queryByText } = render(
      <StocksHorizontalRow tokens={threeTokens} expanded={false} onSelectRwaToken={vi.fn()} onExpand={vi.fn()} />,
    )

    threeTokens.forEach((token) => {
      expect(getByTestId(testIdFor(token))).toBeDefined()
    })
    expect(queryByText('+')).toBeNull()
  })
})
