import { MultichainExplorerList } from 'uniswap/src/components/MultichainTokenDetails/MultichainExplorerList'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

const TEST_ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { chainId: UniverseChainId.Base, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
]

describe(MultichainExplorerList, () => {
  it('renders explorer name for each chain', () => {
    const { queryByText } = render(<MultichainExplorerList chains={TEST_ENTRIES} />)

    expect(queryByText('Etherscan')).toBeTruthy()
    expect(queryByText('BaseScan')).toBeTruthy()
  })

  it('renders chain names', () => {
    const { queryByText } = render(<MultichainExplorerList chains={TEST_ENTRIES} />)

    expect(queryByText('Ethereum')).toBeTruthy()
    expect(queryByText('Base')).toBeTruthy()
  })

  it('calls onExplorerPress with correct URL when row is pressed', () => {
    const onExplorerPress = vi.fn()
    const { getAllByTestId } = render(
      <MultichainExplorerList chains={TEST_ENTRIES} onExplorerPress={onExplorerPress} />,
    )

    const rows = getAllByTestId(TestID.MultichainExplorerLink)
    fireEvent.press(rows[0]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onExplorerPress).toHaveBeenCalledTimes(1)
    expect(onExplorerPress).toHaveBeenCalledWith(expect.stringContaining('etherscan.io'))
  })

  it('renders without error when no onExplorerPress is provided', () => {
    const tree = render(<MultichainExplorerList chains={TEST_ENTRIES} />)

    expect(tree).toMatchSnapshot()
  })
})
