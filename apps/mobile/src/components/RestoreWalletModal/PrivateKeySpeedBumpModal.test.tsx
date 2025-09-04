import React from 'react'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { PrivateKeySpeedBumpModal } from 'src/components/RestoreWalletModal/PrivateKeySpeedBumpModal'
import { fireEvent, render } from 'src/test/test-utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

jest.mock('src/components/modals/useReactNavigationModal', () => ({
  useReactNavigationModal: jest.fn(),
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const reactNative = jest.requireActual('react-native')
  const { View } = reactNative
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetView: View,
  }
})

describe('PrivateKeySpeedBumpModal', () => {
  const mockPreventCloseRef = { current: false }
  const mockNavigation = { navigate: jest.fn() }
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useReactNavigationModal as jest.Mock).mockReturnValue({
      onClose: mockOnClose,
      preventCloseRef: mockPreventCloseRef,
    })
  })

  it('renders correctly', () => {
    // @ts-expect-error Mocking navigation object since it's not critical to this test
    const { toJSON } = render(<PrivateKeySpeedBumpModal navigation={mockNavigation} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('navigates to ViewPrivateKeys screen when Continue button is pressed', () => {
    // @ts-expect-error Mocking navigation object since it's not critical to this test
    const screen = render(<PrivateKeySpeedBumpModal navigation={mockNavigation} />)

    const continueButton = screen.getByTestId(TestID.Continue)
    fireEvent.press(continueButton)

    expect(mockOnClose).toHaveBeenCalled()
    expect(mockNavigation.navigate).toHaveBeenCalledWith(MobileScreens.ViewPrivateKeys)
  })
})
