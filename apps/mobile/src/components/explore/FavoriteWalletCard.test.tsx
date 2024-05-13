import { makeMutable } from 'react-native-reanimated'
import configureMockStore from 'redux-mock-store'
import { Screens } from 'src/screens/Screens'
import { preloadedMobileState } from 'src/test/fixtures'
import { fireEvent, render } from 'src/test/test-utils'
import * as unitagHooks from 'uniswap/src/features/unitags/hooks'
import * as ensHooks from 'wallet/src/features/ens/api'
import {
  ON_PRESS_EVENT_PAYLOAD,
  SAMPLE_SEED_ADDRESS_1,
  preloadedWalletState,
  signerMnemonicAccount,
} from 'wallet/src/test/fixtures'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import FavoriteWalletCard, { FavoriteWalletCardProps } from './FavoriteWalletCard'

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

const defaultProps: FavoriteWalletCardProps = {
  address: SAMPLE_SEED_ADDRESS_1,
  isTouched: makeMutable(false),
  isEditing: false,
  dragActivationProgress: makeMutable(0),
  setIsEditing: jest.fn(),
}

describe('FavoriteWalletCard', () => {
  it('renders without error', () => {
    const tree = render(<FavoriteWalletCard {...defaultProps} />)

    expect(tree).toMatchSnapshot()
  })

  describe('displayName', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('renders unitag name if available', () => {
      jest.spyOn(unitagHooks, 'useUnitagByAddress').mockReturnValue({
        unitag: { username: 'unitagname' },
        loading: false,
      })

      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />)

      expect(queryByText('unitagname')).toBeTruthy()
    })

    it('renders ens name if available', () => {
      jest.spyOn(ensHooks, 'useENSName').mockReturnValue({
        data: 'ensname.eth',
        loading: false,
        error: undefined,
      })

      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />)

      expect(queryByText('ensname.eth')).toBeTruthy()
    })

    it('renders local name if wallet name is set locally', () => {
      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />, {
        preloadedState: preloadedMobileState({
          wallet: preloadedWalletState({
            account: signerMnemonicAccount({
              address: defaultProps.address,
              name: 'Local account',
            }),
          }),
        }),
      })

      expect(queryByText('Local account')).toBeTruthy()
    })

    it('renders wallet address in other cases', () => {
      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />)

      const displayedAddress = sanitizeAddressText(shortenAddress(defaultProps.address))!

      expect(queryByText(displayedAddress)).toBeTruthy()
    })
  })

  describe('when not editing', () => {
    it('navigates to the wallet details screen when pressed', () => {
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} />)

      const touchable = getByTestId('favorite-wallet-card')
      fireEvent.press(touchable, ON_PRESS_EVENT_PAYLOAD)

      expect(mockedNavigation.navigate).toHaveBeenCalledWith(Screens.ExternalProfile, {
        address: defaultProps.address,
      })
    })

    it('does not display the remove button', () => {
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} />)

      const removeButton = getByTestId('explore/remove-button')

      expect(removeButton).toHaveAnimatedStyle({ opacity: 0 })
    })
  })

  describe('when editing', () => {
    it('displays the remove button', () => {
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} isEditing />)

      const removeButton = getByTestId('explore/remove-button')

      expect(removeButton).toHaveAnimatedStyle({ opacity: 1 })
    })

    it('dispatches removeWatchedAddress when remove button is pressed', () => {
      const store = mockStore({
        favorites: { tokens: [] },
        wallet: {
          accounts: {
            [defaultProps.address]: signerMnemonicAccount({ address: defaultProps.address }),
          },
        },
      })
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} isEditing />, {
        store,
      })

      const removeButton = getByTestId('explore/remove-button')
      fireEvent.press(removeButton, ON_PRESS_EVENT_PAYLOAD)

      expect(store.getActions()).toEqual([
        {
          type: 'favorites/removeWatchedAddress',
          payload: { address: defaultProps.address },
        },
      ])
    })
  })
})
