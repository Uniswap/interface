import { ChainId } from 'uniswap/src/types/chains'
import { NetworkFee } from 'wallet/src/components/network/NetworkFee'
import { render } from 'wallet/src/test/test-utils'

jest.mock('wallet/src/features/gas/hooks', () => {
  return {
    useUSDValue: (_chainId: ChainId, gasFee: string): string => gasFee,
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
      <NetworkFee chainId={ChainId.Mainnet} gasFee={{ value: '500', loading: false }} />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in a loading state', () => {
    const tree = render(<NetworkFee chainId={ChainId.Mainnet} gasFee={{ loading: true }} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkFee in an error state', () => {
    const tree = render(
      <NetworkFee chainId={ChainId.Mainnet} gasFee={{ error: true, loading: false }} />
    )
    expect(tree).toMatchSnapshot()
  })
})
