import { ChainId } from 'uniswap/src/types/chains'
import { render } from 'wallet/src/test/test-utils'
import { NetworkLogo, TransactionSummaryNetworkLogo } from './NetworkLogo'

jest.mock('wallet/src/constants/chains', () => {
  const actualChains = jest.requireActual('wallet/src/constants/chains')

  const mockedChainInfo = {
    ...actualChains.CHAIN_INFO,
    ['chainWithoutLogo']: {
      logo: undefined, // no logo - for testing
    },
  }

  return {
    ...actualChains,
    CHAIN_INFO: mockedChainInfo,
  }
})

describe('NetworkLogo', () => {
  const ACTUAL_CHAIN_INFO = jest.requireActual('wallet/src/constants/chains').CHAIN_INFO

  it('renders without error', () => {
    const tree = render(<NetworkLogo chainId={ChainId.Base} />)

    expect(tree).toMatchSnapshot()
  })

  it('renders logo when the chain info has a logo', () => {
    Object.keys(ACTUAL_CHAIN_INFO).forEach((chainId) => {
      const tree = render(<NetworkLogo chainId={chainId as unknown as ChainId} />)

      expect(tree.toJSON()).toBeTruthy()
    })
  })

  it('renders null when chain info has no logo', () => {
    const tree = render(<NetworkLogo chainId={'chainWithoutLogo' as unknown as ChainId} />)

    expect(tree.toJSON()).toBeNull()
  })
})

describe(TransactionSummaryNetworkLogo, () => {
  it('renders without error', () => {
    const tree = render(<TransactionSummaryNetworkLogo chainId={ChainId.Base} />)

    expect(tree).toMatchSnapshot()
  })
})
