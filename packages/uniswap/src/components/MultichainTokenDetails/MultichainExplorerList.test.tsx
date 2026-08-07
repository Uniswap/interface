import { MultichainExplorerList } from 'uniswap/src/components/MultichainTokenDetails/MultichainExplorerList'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { fireEvent, render } from 'uniswap/src/test/test-utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

const TEST_ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', isNative: false },
  { chainId: UniverseChainId.Base, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', isNative: false },
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
    expect(onExplorerPress).toHaveBeenCalledWith(
      getExplorerLink({
        chainId: TEST_ENTRIES[0]!.chainId,
        data: TEST_ENTRIES[0]!.address,
        type: ExplorerDataType.TOKEN,
      }),
      TEST_ENTRIES[0]!.chainId,
    )
  })

  it('uses the network explorer root for a native entry in a mixed list', () => {
    const nativeEntry: MultichainTokenEntry = {
      chainId: UniverseChainId.Bnb,
      address: getNativeAddress(UniverseChainId.Bnb),
      isNative: true,
    }
    const onExplorerPress = vi.fn()
    const { getAllByTestId } = render(
      <MultichainExplorerList chains={[TEST_ENTRIES[0]!, nativeEntry]} onExplorerPress={onExplorerPress} />,
    )

    fireEvent.press(getAllByTestId(TestID.MultichainExplorerLink)[1]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onExplorerPress).toHaveBeenCalledWith(
      getExplorerLink({ chainId: UniverseChainId.Bnb, type: ExplorerDataType.NATIVE }),
      UniverseChainId.Bnb,
    )
  })

  it('renders without error when no onExplorerPress is provided', () => {
    const tree = render(<MultichainExplorerList chains={TEST_ENTRIES} />)

    expect(tree).toMatchSnapshot()
  })
})
