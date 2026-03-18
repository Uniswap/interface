import { NetworkLogo, TransactionSummaryNetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/chains/chainInfo', async (importOriginal) => {
  const actualChains = await importOriginal<typeof import('uniswap/src/features/chains/chainInfo')>()

  return {
    ...actualChains,
    getChainInfo: (chainId: unknown): unknown => {
      if (chainId === 'chainWithoutLogo') {
        return {
          logo: undefined, // no logo - for testing
        }
      } else {
        return actualChains.UNIVERSE_CHAIN_INFO[chainId as UniverseChainId]
      }
    },
  }
})

const ACTUAL_CHAIN_INFO = (
  await vi.importActual<typeof import('uniswap/src/features/chains/chainInfo')>('uniswap/src/features/chains/chainInfo')
).UNIVERSE_CHAIN_INFO

describe('NetworkLogo', () => {
  it('renders without error', () => {
    const { toJSON } = render(<NetworkLogo chainId={UniverseChainId.Base} />)

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders logo when the chain info has a logo', () => {
    Object.keys(ACTUAL_CHAIN_INFO).forEach((chainId) => {
      const tree = render(<NetworkLogo chainId={chainId as unknown as UniverseChainId} />)
      expect(tree.toJSON()).toBeTruthy()
    })
  })

  it('renders null when chain info has no logo', () => {
    const { queryByTestId } = render(<NetworkLogo chainId={'chainWithoutLogo' as unknown as UniverseChainId} />)

    // The wrapper may still exist, but the logo element should not be rendered
    expect(queryByTestId('network-logo')).toBeNull()
  })
})

describe(TransactionSummaryNetworkLogo, () => {
  it('renders without error', () => {
    const { toJSON } = render(<TransactionSummaryNetworkLogo chainId={UniverseChainId.Base} />)

    expect(toJSON()).toMatchSnapshot()
  })
})
