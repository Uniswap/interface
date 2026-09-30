import userEvent from '@testing-library/user-event'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import type { UseTokenMetadataResult } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { Language } from 'uniswap/src/features/language/constants'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
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

vi.mock('~/hooks/Tokens')
vi.mock('~/hooks/useSwapTaxes')

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenMetadata: vi.fn(),
}))

vi.mock('uniswap/src/features/language/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/hooks')>()),
  useCurrentLanguage: vi.fn(),
}))

const SINGLE_CHAIN_MAP = {
  [UniverseChainId.Mainnet]: { address: USDC_MAINNET.address },
}

const MULTI_CHAIN_MAP = {
  [UniverseChainId.Mainnet]: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  [UniverseChainId.Base]: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
}

const VALID_METADATA: UseTokenMetadataResult = {
  name: 'USD Coin',
  symbol: 'USDC',
  description:
    'USDC is a fully collateralized US dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges. The technology behind CENTRE makes it possible to exchange value between people, businesses and financial institutions just like email between mail services and texts between SMS providers. We believe by removing artificial economic borders, we can create a more inclusive global economy.',
  homepageUrl: 'https://www.circle.com/en/usdc',
  twitterName: 'circle',
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  isLoading: false,
}

const EMPTY_METADATA: UseTokenMetadataResult = { isLoading: false }

function mockTDPState(state: Partial<TDPState>): void {
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
    selector(state as TDPState)) as typeof useTDPStore)
}

const USDC_STATE: Partial<TDPState> = {
  address: USDC_MAINNET.address,
  currency: USDC_MAINNET,
  currencyChain: GraphQLApi.Chain.Ethereum,
  currencyChainId: UniverseChainId.Mainnet,
  multiChainMap: SINGLE_CHAIN_MAP,
}

describe('TokenDescription', () => {
  beforeEach(() => {
    mocked(useCurrency).mockReturnValue(validUSDCCurrency)
    mocked(useSwapTaxes).mockReturnValue({ inputTax: ZERO_PERCENT, outputTax: ZERO_PERCENT })
    mocked(useTokenMetadata).mockReturnValue(VALID_METADATA)
    mocked(useCurrentLanguage).mockReturnValue(Language.English)
  })

  describe('translated description', () => {
    const TRANSLATED_METADATA: UseTokenMetadataResult = {
      ...VALID_METADATA,
      description: 'Short English description.',
      descriptionTranslations: { 'es-ES': 'Descripción corta en español.' },
    }

    it('shows the translation for the current language without interaction', () => {
      mocked(useTokenMetadata).mockReturnValue(TRANSLATED_METADATA)
      mocked(useCurrentLanguage).mockReturnValue(Language.SpanishSpain)
      mockTDPState(USDC_STATE)

      render(<TokenDescription />)

      expect(screen.getByText('Descripción corta en español.')).toBeVisible()
      expect(screen.queryByText('Short English description.')).toBeNull()
    })

    it('falls back to the original description when no translation matches', () => {
      mocked(useTokenMetadata).mockReturnValue(TRANSLATED_METADATA)
      mocked(useCurrentLanguage).mockReturnValue(Language.Japanese)
      mockTDPState(USDC_STATE)

      render(<TokenDescription />)

      expect(screen.getByText('Short English description.')).toBeVisible()
    })
  })

  it('renders token information correctly with defaults', () => {
    mockTDPState(USDC_STATE)
    const { asFragment } = render(<TokenDescription />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('About')).toBeVisible()
    expect(screen.getByText('Website')).toBeVisible()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  it('truncates description and shows more', async () => {
    mockTDPState(USDC_STATE)
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
    mocked(useTokenMetadata).mockReturnValue(EMPTY_METADATA)
    mockTDPState(USDC_STATE)
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
    mocked(useTokenMetadata).mockReturnValue({
      ...VALID_METADATA,
      // oxlint-disable-next-line no-script-url
      homepageUrl: 'javascript:alert(1)',
    })
    mockTDPState(USDC_STATE)

    render(<TokenDescription />)

    expect(screen.queryByText('Website')).toBeNull()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  describe('multichain', () => {
    it('renders single-chain pills when only one chain', () => {
      mockTDPState(USDC_STATE)

      render(<TokenDescription />)

      // Single-chain behavior
      expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
      expect(screen.getByText('Etherscan')).toBeVisible()
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByTestId(TestID.MultichainExplorerDropdown)).toBeNull()
    })

    it('renders multichain dropdown triggers when multiple chains exist', () => {
      mockTDPState({ ...USDC_STATE, multiChainMap: MULTI_CHAIN_MAP })

      render(<TokenDescription />)

      // Multichain dropdowns should be present
      expect(screen.getByTestId(TestID.MultichainAddressDropdown)).toBeVisible()
      expect(screen.getByTestId(TestID.MultichainExplorerDropdown)).toBeVisible()
      // Single-chain elements should NOT be present
      expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
      expect(screen.queryByText('Etherscan')).toBeNull()
    })

    it('hides address pill for native token even with multichain', () => {
      mockTDPState({
        ...USDC_STATE,
        address: ETH_MAINNET.wrapped.address,
        currency: ETH_MAINNET,
        multiChainMap: MULTI_CHAIN_MAP,
      })

      render(<TokenDescription />)

      // No address pill for native token
      expect(screen.queryByTestId(TestID.MultichainAddressDropdown)).toBeNull()
      expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
      // Explorer dropdown still shows
      expect(screen.getByTestId(TestID.MultichainExplorerDropdown)).toBeVisible()
    })
  })
})
