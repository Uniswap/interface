import React from 'react'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { PrivateKeySpeedBumpModal } from 'src/components/RestoreWalletModal/PrivateKeySpeedBumpModal'
import { fireEvent, render } from 'src/test/test-utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import type { Mock } from 'vitest'

vi.mock('src/components/modals/useReactNavigationModal', () => ({
  useReactNavigationModal: vi.fn(),
}))

describe('PrivateKeySpeedBumpModal', () => {
  const mockPreventCloseRef = { current: false }
  const mockNavigation = { navigate: vi.fn() }
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useReactNavigationModal as Mock).mockReturnValue({
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
