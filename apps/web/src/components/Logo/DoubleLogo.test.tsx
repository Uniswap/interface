import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { nativeOnChain, UNI, WBTC } from 'uniswap/src/constants/tokens'
import { SafetyLevel } from 'uniswap/src/features/dataApi/safety'
import { getRestCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

describe('DoubleLogo', () => {
  const mockCurrency1: Token = {
    isToken: true,
    chainId: UniverseChainId.Mainnet,
    address: UNI[UniverseChainId.Mainnet].address,
    symbol: UNI[UniverseChainId.Mainnet].symbol,
    name: UNI[UniverseChainId.Mainnet].name,
    decimals: UNI[UniverseChainId.Mainnet].decimals,
  } as Token
  const mockCurrency1Id = `${mockCurrency1.chainId}-${mockCurrency1.address}`

  const mockCurrency2: Token = {
    isToken: true,
    chainId: UniverseChainId.Mainnet,
    address: WBTC.address,
    symbol: WBTC.symbol,
    name: WBTC.name,
    decimals: WBTC.decimals,
  } as Token
  const mockCurrency2Id = `${mockCurrency2.chainId}-${mockCurrency2.address}`
  const mockCurrency2LogoUrl =
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260fac5e5542a773aa44fbcfeDf7c193bc2c599/logo.png'

  beforeEach(() => {
    mocked(useCurrencyInfo).mockImplementation((currencyId: string | undefined) => {
      if (!currencyId) {
        return undefined
      }

      if (currencyId === mockCurrency1Id) {
        return {
          currency: mockCurrency1,
          logoUrl:
            'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
          currencyId: UNI[UniverseChainId.Mainnet].address,
          safetyInfo: getRestCurrencySafetyInfo(SafetyLevel.Verified),
        }
      }

      if (currencyId === mockCurrency2Id) {
        return {
          currency: mockCurrency2,
          logoUrl: mockCurrency2LogoUrl,
          currencyId: WBTC.address,
          safetyInfo: getRestCurrencySafetyInfo(SafetyLevel.Verified),
        }
      }

      return undefined
    })
  })

  it('renders with two valid currencies', () => {
    const { asFragment } = render(<DoubleCurrencyLogo currencies={[mockCurrency1, mockCurrency2]} size={32} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with one valid and one undefined currency', () => {
    const { asFragment } = render(<DoubleCurrencyLogo currencies={[mockCurrency1, undefined]} size={32} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with two undefined currencies', () => {
    const { asFragment } = render(<DoubleCurrencyLogo currencies={[undefined, undefined]} size={32} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with custom size', () => {
    const { asFragment } = render(<DoubleCurrencyLogo currencies={[mockCurrency1, mockCurrency2]} size={48} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders with custom icon', () => {
    const { asFragment } = render(
      <DoubleCurrencyLogo
        currencies={[mockCurrency1, mockCurrency2]}
        size={32}
        customIcon={<Flex data-testid="custom-icon">Custom Icon</Flex>}
      />,
    )
    expect(asFragment()).toMatchSnapshot()
  })

  describe('with served logos', () => {
    const servedLogo1 = 'https://served.example/uni.png'
    const servedLogo2 = 'https://served.example/wbtc.png'

    function renderedImageSources(container: HTMLElement): (string | null)[] {
      return Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders the served logos without looking the tokens up', () => {
      const { container } = render(
        <DoubleCurrencyLogo
          currencies={[mockCurrency1, mockCurrency2]}
          servedLogos={[
            { currency: mockCurrency1, logoUrl: servedLogo1 },
            { currency: mockCurrency2, logoUrl: servedLogo2 },
          ]}
          size={32}
        />,
      )
      expect(renderedImageSources(container)).toEqual(expect.arrayContaining([servedLogo1, servedLogo2]))
      expect(useCurrencyInfo).toHaveBeenCalledWith(mockCurrency1Id, { skip: true })
      expect(useCurrencyInfo).toHaveBeenCalledWith(mockCurrency2Id, { skip: true })
    })

    it('falls back to the lookup for a currency without a served logo', () => {
      const { container } = render(
        <DoubleCurrencyLogo
          currencies={[mockCurrency1, mockCurrency2]}
          servedLogos={[{ currency: mockCurrency1, logoUrl: servedLogo1 }]}
          size={32}
        />,
      )
      const sources = renderedImageSources(container)
      expect(sources).toContain(servedLogo1)
      expect(sources).toContain(mockCurrency2LogoUrl)
      expect(useCurrencyInfo).toHaveBeenCalledWith(mockCurrency1Id, { skip: true })
      expect(useCurrencyInfo).toHaveBeenCalledWith(mockCurrency2Id, { skip: false })
    })

    it('keeps the bundled native asset for a native leg over the served wrapped-token logo', () => {
      const nativeAddress = getNativeAddress(UniverseChainId.Mainnet)
      const servedWrappedLogo = 'https://served.example/weth.png'
      const native = nativeOnChain(UniverseChainId.Mainnet)
      const { container } = render(
        <DoubleCurrencyLogo
          currencies={[native, mockCurrency2]}
          servedLogos={[
            { currency: native, logoUrl: servedWrappedLogo },
            { currency: mockCurrency2, logoUrl: servedLogo2 },
          ]}
          size={32}
        />,
      )
      const sources = renderedImageSources(container)
      expect(sources).not.toContain(servedWrappedLogo)
      expect(sources).toContain(getCommonBase(UniverseChainId.Mainnet, nativeAddress)?.logoUrl)
      expect(useCurrencyInfo).toHaveBeenCalledWith(buildCurrencyId(UniverseChainId.Mainnet, nativeAddress), {
        skip: true,
      })
    })

    it('attaches a served logo to its currency regardless of list order', () => {
      const { container } = render(
        <DoubleCurrencyLogo
          currencies={[mockCurrency1, undefined]}
          servedLogos={[
            { currency: mockCurrency2, logoUrl: servedLogo2 },
            { currency: mockCurrency1, logoUrl: servedLogo1 },
          ]}
          size={32}
        />,
      )
      const sources = renderedImageSources(container)
      expect(sources).toContain(servedLogo1)
      expect(sources).not.toContain(servedLogo2)
    })
  })
})
