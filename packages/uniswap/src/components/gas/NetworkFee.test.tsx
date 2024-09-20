import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import { render } from 'uniswap/src/test/test-utils'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'

jest.mock('uniswap/src/features/gas/hooks', () => {
  return {
    useFormattedUniswapXGasFeeInfo: jest.fn(() => undefined),
    useUSDValue: (_chainId: WalletChainId, gasFee: string): string => gasFee,
    useGasFeeHighRelativeToValue: jest.fn(() => false),
  }
})

describe(NetworkFee, () => {
  it('renders a NetworkFee normally', () => {
    const tree = render(
      <NetworkFee chainId={UniverseChainId.Mainnet} gasFee={{ value: '500', isLoading: false, error: null }} />,
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in a loading state', () => {
    const tree = render(<NetworkFee chainId={UniverseChainId.Mainnet} gasFee={{ isLoading: true, error: null }} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in an error state', () => {
    const tree = render(
      <NetworkFee chainId={UniverseChainId.Mainnet} gasFee={{ error: new Error(), isLoading: false }} />,
    )
    expect(tree).toMatchSnapshot()
  })
})
