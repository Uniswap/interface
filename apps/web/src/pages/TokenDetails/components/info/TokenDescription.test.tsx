import userEvent from '@testing-library/user-event'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useCurrency } from '~/hooks/Tokens'
import { TokenDescription } from '~/pages/TokenDetails/components/info/TokenDescription'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { ETH_MAINNET } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { validUSDCCurrency } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'

vi.mock('~/hooks/Tokens')

vi.mock('~/pages/TokenDetails/context/TDPContext', () => ({
  useTDPContext: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
  }
})

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
    mocked(useFeatureFlag).mockReturnValue(false)
  })

  it('renders token information correctly with defaults', () => {
    mocked(useTDPContext).mockReturnValue({
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChainName: GraphQLApi.Chain.Ethereum,
      tokenQuery: validTokenProjectResponse,
      multiChainMap: SINGLE_CHAIN_MAP,
    } as any)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('About')).toBeVisible()
    expect(screen.getByText('Website')).toBeVisible()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  it('truncates description and shows more', async () => {
    mocked(useTDPContext).mockReturnValue({
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChainName: GraphQLApi.Chain.Ethereum,
      tokenQuery: validTokenProjectResponse,
      multiChainMap: SINGLE_CHAIN_MAP,
    } as any)
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
    mocked(useTDPContext).mockReturnValue({
      address: USDC_MAINNET.address,
      currency: USDC_MAINNET,
      currencyChainName: GraphQLApi.Chain.Ethereum,
      tokenQuery: { data: undefined, loading: false, error: undefined },
      multiChainMap: SINGLE_CHAIN_MAP,
    } as any)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('No token information available')).toBeVisible()
    expect(screen.queryByText('Website')).toBeNull()
    expect(screen.queryByText('Twitter')).toBeNull()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  describe('multichain', () => {
    it('renders single-chain pills when flag is off even with multiple chains', () => {
      mocked(useFeatureFlag).mockReturnValue(false)
      mocked(useTDPContext).mockReturnValue({
        address: USDC_MAINNET.address,
        currency: USDC_MAINNET,
        currencyChainName: GraphQLApi.Chain.Ethereum,
        tokenQuery: validTokenProjectResponse,
        multiChainMap: MULTI_CHAIN_MAP,
      } as any)

      render(<TokenDescription />)

      // Single-chain behavior: shows shortened address and chain-specific explorer
      expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
      expect(screen.getByText('Etherscan')).toBeVisible()
      // Multichain dropdowns should NOT be present
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByTestId(TestID.MultichainExplorerDropdown)).toBeNull()
    })

    it('renders single-chain pills when flag is on but only one chain', () => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultichainTokenUx)
      mocked(useTDPContext).mockReturnValue({
        address: USDC_MAINNET.address,
        currency: USDC_MAINNET,
        currencyChainName: GraphQLApi.Chain.Ethereum,
        tokenQuery: validTokenProjectResponse,
        multiChainMap: SINGLE_CHAIN_MAP,
      } as any)

      render(<TokenDescription />)

      // Single-chain behavior
      expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
      expect(screen.getByText('Etherscan')).toBeVisible()
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByTestId(TestID.MultichainExplorerDropdown)).toBeNull()
    })

    it('renders multichain dropdown triggers when flag is on and multiple chains exist', () => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultichainTokenUx)
      mocked(useTDPContext).mockReturnValue({
        address: USDC_MAINNET.address,
        currency: USDC_MAINNET,
        currencyChainName: GraphQLApi.Chain.Ethereum,
        tokenQuery: validTokenProjectResponse,
        multiChainMap: MULTI_CHAIN_MAP,
      } as any)

      render(<TokenDescription />)

      // Multichain dropdowns should be present
      expect(screen.getByTestId(TestID.MultichainAddressDropdown)).toBeVisible()
      expect(screen.getByTestId(TestID.MultichainExplorerDropdown)).toBeVisible()
      // Single-chain elements should NOT be present
      expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
      expect(screen.queryByText('Etherscan')).toBeNull()
    })

    it('hides address pill for native token even with multichain', () => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultichainTokenUx)
      mocked(useTDPContext).mockReturnValue({
        address: ETH_MAINNET.wrapped.address,
        currency: ETH_MAINNET,
        currencyChainName: GraphQLApi.Chain.Ethereum,
        tokenQuery: validTokenProjectResponse,
        multiChainMap: MULTI_CHAIN_MAP,
      } as any)

      render(<TokenDescription />)

      // No address pill for native token
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
      // Explorer dropdown still shows
      expect(screen.getByTestId(TestID.MultichainExplorerDropdown)).toBeVisible()
    })
  })
})
