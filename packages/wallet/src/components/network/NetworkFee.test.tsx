import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { NetworkFee } from 'wallet/src/components/network/NetworkFee'
import { render } from 'wallet/src/test/test-utils'

jest.mock('wallet/src/features/gas/hooks', () => {
  return {
    useUSDValue: (_chainId: WalletChainId, gasFee: string): string => gasFee,
  }
})

jest.mock('wallet/src/features/transactions/swap/hooks/useGasFeeHighRelativeToValue', () => {
  return {
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
