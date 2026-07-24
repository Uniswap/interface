import userEvent from '@testing-library/user-event'
import { GraphQLApi } from '@universe/api'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ZERO_PERCENT } from '~/constants/misc'
import { useCurrency } from '~/hooks/Tokens'
import { useSwapTaxes } from '~/hooks/useSwapTaxes'
import { TokenDescription } from '~/pages/TokenDetails/components/info/TokenDescription'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { ETH_MAINNET } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { validUSDCCurrency } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'

vi.mock('~/hooks/Tokens')
vi.mock('~/hooks/useSwapTaxes')

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

const SINGLE_CHAIN_MAP = {
  ETHEREUM: { address: USDC_MAINNET.address },
}

const MULTI_CHAIN_MAP = {
  ETHEREUM: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  BASE: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
}

describe('TokenDescription', () => {
  beforeEach(() => {
    mocked(useCurrency).mockReturnValue(validUSDCCurrency)
    mocked(useSwapTaxes).mockReturnValue({ inputTax: ZERO_PERCENT, outputTax: ZERO_PERCENT })
  })

  it('renders token information correctly with defaults', () => {
    const mockState = {
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChain: GraphQLApi.Chain.Ethereum,
      tokenProjectQuery: validTokenProjectResponse,
      multiChainMap: SINGLE_CHAIN_MAP,
    }
    mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
      selector(mockState as TDPState)) as typeof useTDPStore)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('About')).toBeVisible()
    expect(screen.getByText('Website')).toBeVisible()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  it('truncates description and shows more', async () => {
    const mockState = {
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChain: GraphQLApi.Chain.Ethereum,
      tokenProjectQuery: validTokenProjectResponse,
      multiChainMap: SINGLE_CHAIN_MAP,
    }
    mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
      selector(mockState as TDPState)) as typeof useTDPStore)
    const { asFragment } = render(<TokenDescription />)

    expect(asFragment()).toMatchSnapshot()

    // Initially only truncated description is in the DOM
    expect(screen.getByTestId(TestID.TokenDetailsDescriptionTruncated)).toBeVisible()
    expect(screen.queryByTestId(TestID.TokenDetailsDescriptionFull)).toBeNull()

    await userEvent.click(screen.getByText('Show more'))

    // After expanding, only full description is in the DOM
    expect(screen.getByTestId(TestID.TokenDetailsDescriptionFull)).toBeVisible()
    expect(screen.queryByTestId(TestID.TokenDetailsDescriptionTruncated)).toBeNull()
    expect(screen.getByText('Hide')).toBeVisible()
  })

  it('no description or social buttons shown when not available', async () => {
    const mockState = {
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChain: GraphQLApi.Chain.Ethereum,
      tokenProjectQuery: { data: undefined, loading: false, error: undefined },
      multiChainMap: SINGLE_CHAIN_MAP,
    }
    mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
      selector(mockState as TDPState)) as typeof useTDPStore)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('No token information available')).toBeVisible()
    expect(screen.queryByText('Website')).toBeNull()
    expect(screen.queryByText('Twitter')).toBeNull()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  it('does not render website pill for javascript: URI', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const validData = validTokenProjectResponse.data!
    const unsafeTokenProjectQuery = {
      ...validTokenProjectResponse,
      data: {
        ...validData,
        token: {
          ...validData.token,
          project: {
            ...validData.token?.project,
            // oxlint-disable-next-line no-script-url
            homepageUrl: 'javascript:alert(1)',
          },
        },
      },
    }
    const mockState = {
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChain: GraphQLApi.Chain.Ethereum,
      tokenProjectQuery: unsafeTokenProjectQuery,
      multiChainMap: SINGLE_CHAIN_MAP,
    }
    mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
      selector(mockState as TDPState)) as typeof useTDPStore)

    render(<TokenDescription />)

    expect(screen.queryByText('Website')).toBeNull()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  describe('multichain', () => {
    it('renders single-chain pills when only one chain', () => {
      const mockState = {
        address: USDC_MAINNET.address,
        currency: USDC_MAINNET,
        currencyChain: GraphQLApi.Chain.Ethereum,
        tokenProjectQuery: validTokenProjectResponse,
        multiChainMap: SINGLE_CHAIN_MAP,
      }
      mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
        selector(mockState as TDPState)) as typeof useTDPStore)

      render(<TokenDescription />)

      // Single-chain behavior
      expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
      expect(screen.getByText('Etherscan')).toBeVisible()
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByTestId(TestID.MultichainExplorerDropdown)).toBeNull()
    })

    it('renders multichain dropdown triggers when multiple chains exist', () => {
      const mockState = {
        address: USDC_MAINNET.address,
        currency: USDC_MAINNET,
        currencyChain: GraphQLApi.Chain.Ethereum,
        tokenProjectQuery: validTokenProjectResponse,
        multiChainMap: MULTI_CHAIN_MAP,
      }
      mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
        selector(mockState as TDPState)) as typeof useTDPStore)

      render(<TokenDescription />)

      // Multichain dropdowns should be present
      expect(screen.getByTestId(TestID.MultichainAddressDropdown)).toBeVisible()
      expect(screen.getByTestId(TestID.MultichainExplorerDropdown)).toBeVisible()
      // Single-chain elements should NOT be present
      expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
      expect(screen.queryByText('Etherscan')).toBeNull()
    })

    it('hides address pill for native token even with multichain', () => {
      const mockState = {
        address: ETH_MAINNET.wrapped.address,
        currency: ETH_MAINNET,
        currencyChain: GraphQLApi.Chain.Ethereum,
        tokenProjectQuery: validTokenProjectResponse,
        multiChainMap: MULTI_CHAIN_MAP,
      }
      mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
        selector(mockState as TDPState)) as typeof useTDPStore)

      render(<TokenDescription />)

      // No address pill for native token
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
      // Explorer dropdown still shows
      expect(screen.getByTestId(TestID.MultichainExplorerDropdown)).toBeVisible()
    })
  })
})
