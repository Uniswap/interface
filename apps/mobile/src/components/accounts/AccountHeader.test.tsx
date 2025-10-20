import * as ExpoClipboard from 'expo-clipboard'
import { State } from 'react-native-gesture-handler'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { fireEvent, render, screen, waitFor, within } from 'src/test/test-utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { ACCOUNT, preloadedWalletPackageState, signerMnemonicAccount } from 'wallet/src/test/fixtures'

const preloadedState = preloadedWalletPackageState({ account: ACCOUNT })
const address = ACCOUNT.address
const shortenedAddress = sanitizeAddressText(shortenAddress({ address }))!
const navigate = jest.fn()

describe(AccountHeader, () => {
  it('renders correctly', () => {
    const tree = render(<AccountHeader />, { preloadedState })

    expect(tree.toJSON()).toMatchSnapshot()
  })

  describe('when wallet has no display name', () => {
    const accountWithoutName = signerMnemonicAccount({ name: undefined, address })
    const stateWithoutName = preloadedWalletPackageState({
      account: accountWithoutName,
    })

    it('renders shortened address within section address without name section', () => {
      render(<AccountHeader />, { preloadedState: stateWithoutName })

      const addressSection = screen.getByTestId(TestID.AccountHeaderCopyAddress)
      const addressText = within(addressSection).queryByText(shortenedAddress)

      expect(addressText).toBeTruthy()
    })

    it('copies wallet address to clipboard when address section is pressed', async () => {
      const setStringAsync = jest.fn()
      jest.spyOn(ExpoClipboard, 'setStringAsync').mockImplementation(setStringAsync)
      render(<AccountHeader />, { preloadedState: stateWithoutName })

      const addressSection = screen.getByTestId(TestID.AccountHeaderCopyAddress)
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

    it('opens account switcher modal when account name is pressed', async () => {
      jest.spyOn(navigationRef, 'isReady').mockImplementation(() => true)
      jest.spyOn(navigationRef, 'navigate').mockImplementation(navigate)

      render(<AccountHeader />, { preloadedState })

      const displayNameText = within(screen.getByTestId('account-header/display-name')).getByText(ACCOUNT.name)

      fireEvent.press(displayNameText, ON_PRESS_EVENT_PAYLOAD)

      await waitFor(() => {
        expect(navigate).toHaveBeenCalledTimes(1)
        expect(navigate).toHaveBeenCalledWith(ModalName.AccountSwitcher, undefined)
      })
    })
  })

  it('opens account switcher modal when account avatar is pressed', async () => {
    jest.spyOn(navigationRef, 'isReady').mockImplementation(() => true)
    jest.spyOn(navigationRef, 'navigate').mockImplementation(navigate)

    render(<AccountHeader />, { preloadedState })

    const avatar = screen.getByTestId('account-icon')

    fireEvent.press(avatar, ON_PRESS_EVENT_PAYLOAD)

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(ModalName.AccountSwitcher, undefined)
    })
  })

  it('opens settings screen when settings button is pressed', async () => {
    jest.spyOn(navigationRef, 'isReady').mockImplementation(() => true)
    jest.spyOn(navigationRef, 'navigate').mockImplementation(navigate)
    render(<AccountHeader />, { preloadedState })

    const settingsButton = getByGestureTestId(TestID.AccountHeaderSettings)
    fireGestureHandler(settingsButton, [{ state: State.ACTIVE }])

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(MobileScreens.SettingsStack, {
        screen: MobileScreens.Settings,
      })
    })
  })
})
