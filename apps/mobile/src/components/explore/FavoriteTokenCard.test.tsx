import { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import FavoriteTokenCard, { FavoriteTokenCardProps } from 'src/components/explore/FavoriteTokenCard'
import { act, cleanup, fireEvent, render, waitFor } from 'src/test/test-utils'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { DAI } from 'uniswap/src/constants/tokens'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { ON_PRESS_EVENT_PAYLOAD, SAMPLE_CURRENCY_ID_1 } from 'uniswap/src/test/fixtures'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const { mockedNavigation, mockUseIsFocused } = vi.hoisted(() => ({
  mockedNavigation: { navigate: vi.fn() },
  mockUseIsFocused: vi.fn<() => boolean>(),
}))

vi.mock('@react-navigation/native', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@react-navigation/native')>()),
  useNavigation: () => mockedNavigation,
}))

// The component reads focus from @react-navigation/core, not /native.
vi.mock('@react-navigation/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@react-navigation/core')>()),
  useIsFocused: () => mockUseIsFocused(),
}))

// Stub the transport so currency info, spot price and price change all go through their real
// query options and selects against one canned GetToken response.
vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getToken: vi.fn() },
}))

const mockGetToken = vi.mocked(dataApiServiceClientV2.getToken)

const mockStore = configureMockStore([thunk])

// SAMPLE_CURRENCY_ID_1 is mainnet DAI; the REST token carries the card's price fields.
const GET_TOKEN_RESPONSE = new GetTokenResponse({
  token: {
    chainId: UniverseChainId.Mainnet,
    address: DAI.address,
    decimals: DAI.decimals,
    symbol: DAI.symbol,
    name: DAI.name,
    project: { logoUrl: 'https://example.com/dai.png' },
    safety: { isSpam: false, isVerified: true, isBlocked: false },
    price: { spotUsd: 76543.21, percentChange1d: 6.54 },
  },
})

const symbolText = getSymbolDisplayText(DAI.symbol) ?? ''
const touchableId = `${TestID.FavoriteTokenCardPrefix}${DAI.symbol}`

const defaultProps: FavoriteTokenCardProps = {
  currencyId: SAMPLE_CURRENCY_ID_1,
  setIsEditing: vi.fn(),
  isEditing: false,
}

function getTokenQueryRefetchIntervals(): unknown[] {
  return SharedQueryClient.getQueryCache()
    .findAll({ queryKey: [ReactQueryCacheKey.DataApiService, 'getToken'] })
    .flatMap((query) => query.observers.map((observer) => observer.options.refetchInterval))
}

beforeEach(() => {
  vi.clearAllMocks()
  SharedQueryClient.clear()

  mockUseIsFocused.mockReturnValue(true)
  mockGetToken.mockResolvedValue(GET_TOKEN_RESPONSE)
})

describe('FavoriteTokenCard', () => {
  it('renders without error', async () => {
    const tree = render(<FavoriteTokenCard {...defaultProps} />)

    expect(tree).toMatchSnapshot()
    cleanup()
  })

  describe('when token data is being fetched', () => {
    it('renders loader', async () => {
      const { queryByTestId, queryByText } = render(<FavoriteTokenCard {...defaultProps} />)

      const loaderPrice = queryByTestId('loader/favorite/price')
      const loaderPriceChange = queryByTestId('loader/favorite/priceChange')

      expect(loaderPrice).toBeTruthy()
      expect(loaderPriceChange).toBeTruthy()

      await waitFor(() => {
        expect(queryByText(symbolText)).toBeTruthy()
      })
    })
  })

  describe('when token data is available', () => {
    const cases = [
      { test: 'symbol', value: symbolText },
      { test: 'price', value: '$76,543.21' },
      { test: 'relative price change', value: '6.54%' },
    ]

    it.each(cases)('renders correct $test', async ({ value }) => {
      const { queryByText } = render(<FavoriteTokenCard {...defaultProps} />)

      await waitFor(() => {
        expect(queryByText(value)).toBeTruthy()
      })
    })

    it('navigates to the token details screen when pressed', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} />)

      const touchable = await findByTestId(touchableId)
      act(() => {
        fireEvent.press(touchable, ON_PRESS_EVENT_PAYLOAD)
      })

      expect(mockedNavigation.navigate).toHaveBeenCalledTimes(1)
      expect(mockedNavigation.navigate).toHaveBeenCalledWith('TokenDetails', {
        currencyId: SAMPLE_CURRENCY_ID_1, // passed in component props
      })
    })

    it('does not show remove button when not in edit mode', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} />)

      const removeButton = await findByTestId('explore/remove-button')

      await waitFor(() => {
        expect((removeButton as unknown as HTMLElement).getAttribute('aria-disabled')).toBe('true')
      })
    })
  })

  describe('price polling', () => {
    it('polls the price queries while the screen is focused', async () => {
      const { findByText } = render(<FavoriteTokenCard {...defaultProps} />)
      await findByText('$76,543.21')

      expect(getTokenQueryRefetchIntervals()).toContain(PollingInterval.KindaFast)
    })

    it('stops polling when the screen loses focus but keeps showing data', async () => {
      mockUseIsFocused.mockReturnValue(false)

      const { findByText } = render(<FavoriteTokenCard {...defaultProps} />)
      await findByText('$76,543.21')

      expect(getTokenQueryRefetchIntervals()).not.toContain(PollingInterval.KindaFast)
    })
  })

  describe('edit mode', () => {
    it('shows remove button when in edit mode', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} isEditing />)

      const removeButton = await findByTestId('explore/remove-button')

      await waitFor(() => {
        expect((removeButton as unknown as HTMLElement).getAttribute('aria-disabled')).toBeNull()
      })
    })

    it('dispatches removeFavoriteToken action when remove button is pressed', async () => {
      const store = mockStore({
        favorites: { tokens: [] },
        userSettings: { currentCurrency: FiatCurrency.UnitedStatesDollar, currentLanguage: Language.English },
        wallet: { accounts: {}, activeAccountAddress: null },
      })
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} isEditing />, { store })

      const removeButton = await findByTestId('explore/remove-button')
      act(() => {
        fireEvent.press(removeButton, ON_PRESS_EVENT_PAYLOAD)
      })

      const actions = store.getActions()
      expect(actions).toContainEqual({
        type: 'favorites/removeFavoriteToken',
        payload: { currencyId: SAMPLE_CURRENCY_ID_1 },
      })
    })
  })
})
