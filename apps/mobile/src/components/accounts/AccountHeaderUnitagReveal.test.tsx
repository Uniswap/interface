import { TestID } from '@universe/test'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { fireEvent, render, screen, waitFor, within } from 'src/test/test-utils'
import { DisplayName } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { ACCOUNT, LOCAL_DISPLAY_NAME, UNITAG_DISPLAY_NAME, preloadedWalletPackageState } from 'wallet/src/test/fixtures'

const mockUseDisplayName = vi.hoisted(() => vi.fn<() => DisplayName | undefined>())

vi.mock('wallet/src/features/wallet/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wallet/src/features/wallet/hooks')>()),
  useDisplayName: (): DisplayName | undefined => mockUseDisplayName(),
}))

// The unitag branch logs a user property on mount; amplitude is not initialised here.
vi.mock('uniswap/src/features/telemetry/user', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/telemetry/user')>()),
  setUserProperty: vi.fn(),
}))

const preloadedState = preloadedWalletPackageState({ account: ACCOUNT })
const navigate = vi.fn()

// Cannot reproduce the real failure here (jsdom, Reanimated mocked, no gesture arbitration); pins structure only.
describe('AccountHeader unitag suffix reveal', () => {
  beforeEach(() => {
    navigate.mockClear()
    vi.spyOn(navigationRef, 'isReady').mockImplementation(() => true)
    vi.spyOn(navigationRef, 'navigate').mockImplementation(navigate)
  })

  describe('when the display name is a unitag', () => {
    beforeEach(() => {
      mockUseDisplayName.mockReturnValue(UNITAG_DISPLAY_NAME)
    })

    it('gives the username its own touchable rather than leaving it to the header touchable', () => {
      render(<AccountHeader />, { preloadedState })

      const unitagTouchable = screen.getByTestId(TestID.AccountHeaderUnitagDisplayName)

      expect(within(unitagTouchable).getByText(UNITAG_DISPLAY_NAME.name)).toBeTruthy()
    })

    it('keeps the copy-address touchable outside the username touchable', () => {
      render(<AccountHeader />, { preloadedState })

      const unitagTouchable = screen.getByTestId(TestID.AccountHeaderUnitagDisplayName)

      expect(screen.getByTestId(TestID.AccountHeaderCopyAddress)).toBeTruthy()
      expect(within(unitagTouchable).queryByTestId(TestID.AccountHeaderCopyAddress)).toBeNull()
    })

    it('does not open the account switcher when the username is pressed', async () => {
      render(<AccountHeader />, { preloadedState })

      fireEvent.press(screen.getByTestId(TestID.AccountHeaderUnitagDisplayName), ON_PRESS_EVENT_PAYLOAD)

      await waitFor(() => {
        expect(navigate).not.toHaveBeenCalled()
      })
    })

    it('still opens the account switcher from the avatar', async () => {
      render(<AccountHeader />, { preloadedState })

      fireEvent.press(screen.getByTestId('account-icon'), ON_PRESS_EVENT_PAYLOAD)

      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith(ModalName.AccountSwitcher, undefined)
      })
    })
  })

  describe('when the display name is not a unitag', () => {
    beforeEach(() => {
      mockUseDisplayName.mockReturnValue(LOCAL_DISPLAY_NAME)
    })

    it('adds no username touchable and leaves the header touchable in charge', async () => {
      render(<AccountHeader />, { preloadedState })

      expect(screen.queryByTestId(TestID.AccountHeaderUnitagDisplayName)).toBeNull()

      fireEvent.press(screen.getByText(LOCAL_DISPLAY_NAME.name), ON_PRESS_EVENT_PAYLOAD)

      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith(ModalName.AccountSwitcher, undefined)
      })
    })
  })
})
