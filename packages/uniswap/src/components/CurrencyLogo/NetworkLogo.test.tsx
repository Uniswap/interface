import { NetworkLogo, TransactionSummaryNetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

jest.mock('uniswap/src/features/chains/chainInfo', () => {
  const actualChains = jest.requireActual('uniswap/src/features/chains/chainInfo')

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

describe('NetworkLogo', () => {
  const ACTUAL_CHAIN_INFO = jest.requireActual('uniswap/src/features/chains/chainInfo').UNIVERSE_CHAIN_INFO

  it('renders without error', () => {
    const tree = render(<NetworkLogo chainId={UniverseChainId.Base} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders logo when the chain info has a logo', () => {
    Object.keys(ACTUAL_CHAIN_INFO).forEach((chainId) => {
      const tree = render(<NetworkLogo chainId={chainId as unknown as UniverseChainId} />)
      expect(tree.toJSON()).toBeTruthy()
    })
  })

  it('renders null when chain info has no logo', () => {
    const tree = render(<NetworkLogo chainId={'chainWithoutLogo' as unknown as UniverseChainId} />)

    expect(tree.toJSON()).toBeNull()
  })
})

describe(TransactionSummaryNetworkLogo, () => {
  it('renders without error', () => {
    const tree = render(<TransactionSummaryNetworkLogo chainId={UniverseChainId.Base} />)

    expect(tree).toMatchSnapshot()
  })
})
