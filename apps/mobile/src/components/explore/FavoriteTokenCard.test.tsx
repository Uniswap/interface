import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import FavoriteTokenCard, { FavoriteTokenCardProps } from 'src/components/explore/FavoriteTokenCard'
import { act, cleanup, fireEvent, render, waitFor } from 'src/test/test-utils'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import {
  amount,
  ethToken,
  ON_PRESS_EVENT_PAYLOAD,
  SAMPLE_CURRENCY_ID_1,
  tokenMarket,
  tokenProject,
  tokenProjectMarket,
} from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { queryResolvers } from 'uniswap/src/test/utils'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

const mockedNavigation = {
  navigate: jest.fn(),
}

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native')
  return {
    ...actualNav,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    useNavigation: () => mockedNavigation,
  }
})

const mockStore = configureMockStore([thunk])

const favoriteToken = ethToken({
  project: {
    ...tokenProject(),
    markets: [
      {
        ...tokenProjectMarket(),
        price: amount({ value: 76543.21 }),
        pricePercentChange24h: amount({ value: 6.54 }),
      },
    ],
  },
  market: tokenMarket({
    price: amount({ value: 12345.67 }),
    pricePercentChange: amount({ value: 4.56 }),
  }),
})

const touchableId = `${TestID.FavoriteTokenCardPrefix}${favoriteToken.symbol}`

const defaultProps: FavoriteTokenCardProps = {
  currencyId: SAMPLE_CURRENCY_ID_1,
  setIsEditing: jest.fn(),
  isEditing: false,
}

const { resolvers } = queryResolvers({
  token: () => favoriteToken,
})

describe('FavoriteTokenCard', () => {
  it('renders without error', async () => {
    const tree = render(<FavoriteTokenCard {...defaultProps} />)

    expect(tree).toMatchSnapshot()
    cleanup()
  })

  describe('when token data is being fetched', () => {
    it('renders loader', async () => {
      const { queryByTestId } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers })

      const loaderPrice = queryByTestId('loader/favorite/price')
      const loaderPriceChange = queryByTestId('loader/favorite/priceChange')

      expect(loaderPrice).toBeTruthy()
      expect(loaderPriceChange).toBeTruthy()

      await waitFor(() => {
        expect(queryByTestId(touchableId)).toBeTruthy()
      })
    })
  })

  describe('when token data is available', () => {
    const cases = [
      { test: 'symbol', value: getSymbolDisplayText(favoriteToken.symbol)! },
      { test: 'price', value: '$76,543.21' },
      { test: 'relative price change', value: '6.54%' },
    ]

    it.each(cases)('renders correct $test', async ({ value }) => {
      const { queryByText } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers })

      await waitFor(() => {
        expect(queryByText(value)).toBeTruthy()
      })
    })

    it('falls back to token price if token project price is not available', async () => {
      const { resolvers: modifiedResolvers } = queryResolvers({
        token: () => ({
          ...favoriteToken,
          project: { ...favoriteToken.project, markets: [] },
        }),
      })

      const { queryByText } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers: modifiedResolvers })

      await waitFor(() => {
        expect(queryByText('$12,345.67')).toBeTruthy()
        expect(queryByText('4.56%')).toBeTruthy()
      })
    })

    it('navigates to the token details screen when pressed', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers })

      const touchable = await findByTestId(`${TestID.FavoriteTokenCardPrefix}${favoriteToken.symbol}`)
      act(() => {
        fireEvent.press(touchable, ON_PRESS_EVENT_PAYLOAD)
      })

      expect(mockedNavigation.navigate).toHaveBeenCalledTimes(1)
      expect(mockedNavigation.navigate).toHaveBeenCalledWith('TokenDetails', {
        currencyId: SAMPLE_CURRENCY_ID_1, // passed in component props
      })
    })

    it('does not show remove button when not in edit mode', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers })

      const removeButton = await findByTestId('explore/remove-button')

      await waitFor(() => {
        expect(removeButton).toHaveAnimatedStyle({ opacity: 0 })
      })
    })
  })

  describe('edit mode', () => {
    it('shows remove button when in edit mode', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} isEditing />, {
        resolvers,
      })

      const removeButton = await findByTestId('explore/remove-button')

      await waitFor(() => {
        expect(removeButton).toHaveAnimatedStyle({ opacity: 1 })
      })
    })

    it('dispatches removeFavoriteToken action when remove button is pressed', async () => {
      const store = mockStore({
        favorites: { tokens: [] },
        userSettings: { currentCurrency: FiatCurrency.UnitedStatesDollar, currentLanguage: Language.English },
      })
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} isEditing />, {
        resolvers,
        store,
      })

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
