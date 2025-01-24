import { makeMutable } from 'react-native-reanimated'
import configureMockStore from 'redux-mock-store'
import FavoriteTokenCard, { FavoriteTokenCardProps } from 'src/components/explore/FavoriteTokenCard'
import { act, cleanup, fireEvent, render, waitFor } from 'src/test/test-utils'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import {
  ON_PRESS_EVENT_PAYLOAD,
  SAMPLE_CURRENCY_ID_1,
  amount,
  ethToken,
  tokenMarket,
  tokenProject,
} from 'uniswap/src/test/fixtures'
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

const mockStore = configureMockStore()

const favoriteToken = ethToken({
  project: tokenProject(),
  market: tokenMarket({
    price: amount({ value: 12345.67 }),
    pricePercentChange: amount({ value: 4.56 }),
  }),
})

const touchableId = `token-box-${favoriteToken.symbol}`

const defaultProps: FavoriteTokenCardProps = {
  currencyId: SAMPLE_CURRENCY_ID_1,
  pressProgress: makeMutable(0),
  dragActivationProgress: makeMutable(0),
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

      const loader = queryByTestId('loader/favorite')

      // loading
      expect(loader).toBeTruthy()

      // loading finished
      await waitFor(() => {
        expect(queryByTestId(touchableId)).toBeTruthy()
      })
    })
  })

  describe('when token data is available', () => {
    const cases = [
      { test: 'symbol', value: getSymbolDisplayText(favoriteToken.symbol)! },
      { test: 'price', value: '$12,345.67' },
      { test: 'relative price change', value: '4.56%' },
    ]

    it.each(cases)('renders correct $test', async ({ value }) => {
      const { queryByText } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers })

      await waitFor(() => {
        expect(queryByText(value)).toBeTruthy()
      })
    })

    it('navigates to the token details screen when pressed', async () => {
      const { findByTestId } = render(<FavoriteTokenCard {...defaultProps} />, { resolvers })

      const touchable = await findByTestId(`token-box-${favoriteToken.symbol}`)
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
      await act(() => {
        fireEvent.press(removeButton, ON_PRESS_EVENT_PAYLOAD)
      })

      const actions = store.getActions()
      expect(actions).toEqual([
        { type: 'favorites/removeFavoriteToken', payload: { currencyId: SAMPLE_CURRENCY_ID_1 } },
      ])
    })
  })
})
