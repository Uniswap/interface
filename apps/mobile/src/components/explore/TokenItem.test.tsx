import * as exploreHooks from 'src/components/explore/hooks'
import { TokenItem } from 'src/components/explore/TokenItem'
import * as tokenDetailsHooks from 'src/components/TokenDetails/hooks'
import { TOKEN_ITEM_DATA, tokenItemData } from 'src/test/fixtures'
import { fireEvent, render, within } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const arbitrumNetworkLogoTestID = `${TestID.NetworkLogoPrefix}${UniverseChainId.ArbitrumOne}`
const mainnetNetworkLogoTestID = `${TestID.NetworkLogoPrefix}${UniverseChainId.Mainnet}`
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: vi.fn().mockReturnValue(false),
  useFeatureFlagWithLoading: vi.fn().mockReturnValue({ value: false, isLoading: false }),
  useFeatureFlagWithExposureLoggingDisabled: vi.fn().mockReturnValue(false),
}))

describe('TokenItem', () => {
  const mockedTokenDetailsNavigation = {
    navigate: vi.fn(),
    navigateWithPop: vi.fn(),
    preload: vi.fn(),
  }

  beforeAll(() => {
    vi.spyOn(tokenDetailsHooks, 'useTokenDetailsNavigation').mockReturnValue(mockedTokenDetailsNavigation)
    vi.spyOn(exploreHooks, 'useExploreTokenContextMenu').mockReturnValue({
      menuActions: [],
      onContextMenuPress: vi.fn(),
    })
  })

  it('renders without error', () => {
    const tree = render(
      <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={TOKEN_ITEM_DATA} />,
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders correct token number based on index', () => {
    const data = tokenItemData()
    const { queryByText } = render(
      <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={1} tokenItemData={data} />,
    )

    expect(queryByText('2')).toBeTruthy()
  })

  it('renders proper token name', () => {
    const data = tokenItemData()
    const { queryByText } = render(
      <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
    )

    expect(queryByText(data.name)).toBeTruthy()
  })

  it('navigates to the token details screen when pressed', () => {
    const data = tokenItemData()
    const { getByTestId } = render(
      <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
    )

    fireEvent.press(getByTestId(`token-item-${data.name}`), ON_PRESS_EVENT_PAYLOAD)

    expect(mockedTokenDetailsNavigation.navigate).toHaveBeenCalledWith(buildCurrencyId(data.chainId, data.address))
  })

  describe('token price', () => {
    it('renders token price if it is provided', () => {
      const data = tokenItemData({ price: 123.45 })
      const { getByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      const tokenPrice = getByTestId('token-item/price')

      expect(within(tokenPrice).queryByText('$123.45')).toBeTruthy()
      expect(within(tokenPrice).queryByText('-')).toBeFalsy()
    })

    it('renders price placeholder if token price is not provided', () => {
      const data = tokenItemData({ price: undefined })
      const { getByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      const tokenPrice = getByTestId('token-item/price')

      expect(within(tokenPrice).queryByText('-')).toBeTruthy()
    })
  })

  describe('token price change', () => {
    it('renders token price change if it is provided', () => {
      const data = tokenItemData({ pricePercentChange24h: 12.34 })
      const { getByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      const relativeChange = getByTestId('relative-change')

      expect(within(relativeChange).queryByText('12.34%')).toBeTruthy()
    })

    it('renders price change placeholder if token price change is not provided', () => {
      const data = tokenItemData({ pricePercentChange24h: undefined })
      const { getByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      const relativeChange = getByTestId('relative-change')

      expect(within(relativeChange).queryByText('-')).toBeTruthy()
    })
  })

  describe('multichain network logo', () => {
    it('should hide network logo when networkCount > 1', () => {
      const data = tokenItemData({ chainId: UniverseChainId.ArbitrumOne, networkCount: 5 })
      const { queryByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      expect(queryByTestId(arbitrumNetworkLogoTestID)).toBeFalsy()
    })

    it('should show network logo when no networkCount', () => {
      const data = tokenItemData({ chainId: UniverseChainId.ArbitrumOne })
      const { queryByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      expect(queryByTestId(arbitrumNetworkLogoTestID)).toBeTruthy()
    })

    it('should show network logo when networkCount is 1', () => {
      const data = tokenItemData({ chainId: UniverseChainId.ArbitrumOne, networkCount: 1 })
      const { queryByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      expect(queryByTestId(arbitrumNetworkLogoTestID)).toBeTruthy()
    })

    it('should show mainnet network logo for single-chain mainnet asset', () => {
      const data = tokenItemData({ chainId: UniverseChainId.Mainnet, networkCount: 1 })
      const { queryByTestId } = render(
        <TokenItem eventName={MobileEventName.ExploreTokenItemSelected} index={0} tokenItemData={data} />,
      )

      expect(queryByTestId(mainnetNetworkLogoTestID)).toBeTruthy()
    })
  })

  describe('metadata subtitle', () => {
    const data = tokenItemData({
      marketCap: 123.45,
      volume24h: 234.56,
      totalValueLocked: 345.67,
    })

    const cases = [
      { test: 'market cap', type: TokenMetadataDisplayType.MarketCap, expected: 'explore.tokens.metadata.marketCap' },
      { test: 'volume', type: TokenMetadataDisplayType.Volume, expected: 'explore.tokens.metadata.volume' },
      {
        test: 'total value locked',
        type: TokenMetadataDisplayType.TVL,
        expected: 'explore.tokens.metadata.totalValueLocked',
      },
      { test: 'symbol', type: TokenMetadataDisplayType.Symbol, expected: data.symbol },
    ]

    it.each(cases)('renders $test metadata subtitle', ({ type, expected }) => {
      const { getByTestId } = render(
        <TokenItem
          eventName={MobileEventName.ExploreTokenItemSelected}
          index={0}
          metadataDisplayType={type}
          tokenItemData={data}
        />,
      )

      const metadataSubtitle = getByTestId('token-item/metadata-subtitle')

      expect(within(metadataSubtitle).queryByText(expected)).toBeTruthy()
    })
  })
})
