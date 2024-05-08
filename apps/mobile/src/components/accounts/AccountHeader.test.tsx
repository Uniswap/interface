import * as ExpoClipboard from 'expo-clipboard'
import { navigationRef } from 'src/app/navigation/NavigationContainer'
import { MobileState } from 'src/app/reducer'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Screens } from 'src/screens/Screens'
import { fireEvent, render, screen, waitFor, within } from 'src/test/test-utils'
import { ModalName } from 'wallet/src/telemetry/constants'
import {
  ACCOUNT,
  ON_PRESS_EVENT_PAYLOAD,
  preloadedSharedState,
  signerMnemonicAccount,
} from 'wallet/src/test/fixtures'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

const preloadedState = preloadedSharedState({ account: ACCOUNT })
const address = ACCOUNT.address
const shortenedAddress = sanitizeAddressText(shortenAddress(address))!

const isModalOpen = (state: MobileState): boolean => {
  const modalState = state.modals[ModalName.AccountSwitcher]
  return modalState.isOpen
}

describe(AccountHeader, () => {
  it('renders correctly', () => {
    const tree = render(<AccountHeader />, { preloadedState })

    expect(tree.toJSON()).toMatchSnapshot()
  })

  describe('when wallet has no display name', () => {
    const accountWithoutName = signerMnemonicAccount({ name: undefined, address })
    const stateWithoutName = preloadedSharedState({
      account: accountWithoutName,
    })

    it('renders shortened address within section address without name section', () => {
      render(<AccountHeader />, { preloadedState: stateWithoutName })

      const addressSection = screen.getByTestId('account-header/address-only')
      const addressText = within(addressSection).queryByText(shortenedAddress)

      expect(addressText).toBeTruthy()
    })

    it('copies wallet address to clipboard when address section is pressed', async () => {
      const setStringAsync = jest.fn()
      jest.spyOn(ExpoClipboard, 'setStringAsync').mockImplementation(setStringAsync)
      render(<AccountHeader />, { preloadedState: stateWithoutName })

      const addressSection = screen.getByTestId('account-header/address-only')
      fireEvent.press(addressSection, ON_PRESS_EVENT_PAYLOAD)

      await waitFor(() => {
        expect(setStringAsync).toHaveBeenCalledTimes(1)
        expect(setStringAsync).toHaveBeenCalledWith(address)
      })
    })
  })

  describe('when wallet has a display name', () => {
    it('renders section with display name and address', () => {
      render(<AccountHeader />, { preloadedState })

      const displayNameSection = screen.getByTestId('account-header/display-name')
      const displayNameText = within(displayNameSection).queryByText(ACCOUNT.name)
      const addressText = within(displayNameSection).queryByText(shortenedAddress)

      expect(displayNameText).toBeTruthy()
      expect(addressText).toBeTruthy()
    })

    it('opens account switcher modal when account name is pressed', () => {
      const { store } = render(<AccountHeader />, { preloadedState })

      const displayNameText = within(screen.getByTestId('account-header/display-name')).getByText(
        ACCOUNT.name
      )

      expect(isModalOpen(store.getState())).toBe(false)

      fireEvent.press(displayNameText, ON_PRESS_EVENT_PAYLOAD)

      expect(isModalOpen(store.getState())).toBe(true)
    })
  })

  it('opens account switcher modal when account avatar is pressed', () => {
    const { store } = render(<AccountHeader />, { preloadedState })

    const avatar = screen.getByTestId('account-icon')

    expect(isModalOpen(store.getState())).toBe(false)

    fireEvent.press(avatar, ON_PRESS_EVENT_PAYLOAD)

    expect(isModalOpen(store.getState())).toBe(true)
  })

  it('opens settings screen when settings button is pressed', async () => {
    const navigate = jest.fn()
    jest.spyOn(navigationRef, 'isReady').mockImplementation(() => true)
    jest.spyOn(navigationRef, 'navigate').mockImplementation(navigate)
    render(<AccountHeader />, { preloadedState })

    const settingsButton = screen.getByTestId('account-header/settings-button')
    fireEvent.press(settingsButton, ON_PRESS_EVENT_PAYLOAD)

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.SettingsStack, { screen: Screens.Settings })
    })
  })
})
