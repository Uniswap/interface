import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { Flex } from 'ui/src'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

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
          safetyInfo: getCurrencySafetyInfo(GraphQLApi.SafetyLevel.Verified, undefined),
        }
      }

      if (currencyId === mockCurrency2Id) {
        return {
          currency: mockCurrency2,
          logoUrl:
            'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260fac5e5542a773aa44fbcfeDf7c193bc2c599/logo.png',
          currencyId: WBTC.address,
          safetyInfo: getCurrencySafetyInfo(GraphQLApi.SafetyLevel.Verified, undefined),
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
})
