import { UseQueryResult } from '@tanstack/react-query'
import type { UnitagAddressResponse } from '@universe/api'
import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import FavoriteWalletCard, { FavoriteWalletCardProps } from 'src/components/explore/FavoriteWalletCard'
import { preloadedMobileState } from 'src/test/fixtures'
import { fireEvent, render, waitFor } from 'src/test/test-utils'
import * as unitagHooks from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import * as ensHooks from 'uniswap/src/features/ens/api'
import { ON_PRESS_EVENT_PAYLOAD, SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { preloadedWalletReducerState, signerMnemonicAccount } from 'wallet/src/test/fixtures'

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

const defaultProps: FavoriteWalletCardProps = {
  address: SAMPLE_SEED_ADDRESS_1,
  isEditing: false,
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
      jest.spyOn(unitagHooks, 'useUnitagsAddressQuery').mockReturnValue({
        data: { username: 'unitagname' },
        isLoading: false,
        isFetching: false,
        isPending: false,
        error: null,
        isError: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        status: 'success',
        refetch: jest.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        isPlaceholderData: false,
        isRefetching: false,
        isStale: false,
        isInitialLoading: false,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isPaused: false,
        promise: Promise.resolve({ username: 'unitagname' }),
      } as UseQueryResult<UnitagAddressResponse>)

      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />)

      expect(queryByText('unitagname')).toBeTruthy()
    })

    it('renders ens name if available', () => {
      jest.spyOn(ensHooks, 'useENSName').mockReturnValue({
        data: 'ensname.eth',
        isLoading: false,
        error: null,
      } as ReturnType<typeof ensHooks.useENSName>)

      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />)

      expect(queryByText('ensname.eth')).toBeTruthy()
    })

    it('renders local name if wallet name is set locally', () => {
      const { queryByText } = render(<FavoriteWalletCard {...defaultProps} />, {
        preloadedState: preloadedMobileState({
          wallet: preloadedWalletReducerState({
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

      const displayedAddress = sanitizeAddressText(shortenAddress({ address: defaultProps.address }))!

      expect(queryByText(displayedAddress)).toBeTruthy()
    })
  })

  describe('when not editing', () => {
    it('navigates to the wallet details screen when pressed', () => {
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} />)

      const touchable = getByTestId('favorite-wallet-card')
      fireEvent.press(touchable, ON_PRESS_EVENT_PAYLOAD)

      expect(mockedNavigation.navigate).toHaveBeenCalledWith(MobileScreens.ExternalProfile, {
        address: defaultProps.address,
      })
    })

    it('does not display the remove button', async () => {
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} />)

      const removeButton = getByTestId('explore/remove-button')

      await waitFor(() => {
        expect(removeButton).toHaveAnimatedStyle({ opacity: 0 })
      })
    })
  })

  describe('when editing', () => {
    it('displays the remove button', async () => {
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} isEditing />)

      const removeButton = getByTestId('explore/remove-button')

      await waitFor(() => {
        expect(removeButton).toHaveAnimatedStyle({ opacity: 1 })
      })
    })

    it('dispatches removeWatchedAddress when remove button is pressed', () => {
      const store = mockStore({
        favorites: { tokens: [], watchedAddresses: [defaultProps.address] },
        wallet: {
          accounts: {
            [defaultProps.address]: signerMnemonicAccount({ address: defaultProps.address }),
          },
        },
        userSettings: {},
      })
      const { getByTestId } = render(<FavoriteWalletCard {...defaultProps} isEditing />, {
        store,
      })

      const removeButton = getByTestId('explore/remove-button')
      fireEvent.press(removeButton, ON_PRESS_EVENT_PAYLOAD)

      expect(store.getActions()).toContainEqual({
        type: 'favorites/removeWatchedAddress',
        payload: { address: defaultProps.address },
      })
    })
  })
})
