import { NetworkLogo, TransactionSummaryNetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { render } from 'uniswap/src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/types/chains'

jest.mock('uniswap/src/constants/chains', () => {
  const actualChains = jest.requireActual('uniswap/src/constants/chains')

  const mockedChainInfo = {
    ...actualChains.UNIVERSE_CHAIN_INFO,
    ['chainWithoutLogo']: {
      logo: undefined, // no logo - for testing
    },
  }

  return {
    ...actualChains,
    UNIVERSE_CHAIN_INFO: mockedChainInfo,
  }
})

describe('NetworkLogo', () => {
  const ACTUAL_CHAIN_INFO = jest.requireActual('uniswap/src/constants/chains').UNIVERSE_CHAIN_INFO

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
