import { fireEvent, waitFor } from '@testing-library/react-native'
import { SharedQueryClient } from '@universe/api'
import { Flex, Text } from 'ui/src'
import { Dialog } from 'uniswap/src/components/dialog/Dialog.web'
import type { DialogPreferencesService } from 'uniswap/src/dialog-preferences'
import { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { renderWithProviders } from 'uniswap/src/test/render'

// Mock the Modal component to avoid BottomSheetModal context issues
jest.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }): JSX.Element | null => {
    return isModalOpen ? <>{children}</> : null
  },
}))

const mockOnClose = jest.fn()
const mockPrimaryClick = jest.fn()
const mockSecondaryClick = jest.fn()

describe('Dialog component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderDialog = (props = {}): ReturnType<typeof renderWithProviders> => {
    return renderWithProviders(
      <Dialog
        isOpen={true}
        icon={<Text>Mock Icon</Text>}
        title="Mock Title"
        subtext="Mock Subtext"
        modalName={ModalName.Dialog}
        primaryButton={{ text: 'Primary Button', onPress: mockPrimaryClick }}
        secondaryButton={{ text: 'Close', onPress: mockOnClose }}
        onClose={mockOnClose}
        {...props}
      />,
    )
  }

  it('renders with required props', () => {
    const { getByText } = renderDialog()

    expect(getByText('Mock Icon')).toBeTruthy()
    expect(getByText('Mock Title')).toBeTruthy()
    expect(getByText('Mock Subtext')).toBeTruthy()
    expect(getByText('Primary Button')).toBeTruthy()
  })

  it('handles close button click', () => {
    const { getByText } = renderDialog()
    const closeButton = getByText('Close')
    fireEvent.press(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles primary button click', () => {
    const { getByText } = renderDialog()
    fireEvent.press(getByText('Primary Button'))
    expect(mockPrimaryClick).toHaveBeenCalled()
  })

  it('handles secondary button click when provided', () => {
    const { getByText } = renderDialog({
      secondaryButton: { text: 'Secondary Button', onPress: mockSecondaryClick },
    })

    fireEvent.press(getByText('Secondary Button'))
    expect(mockSecondaryClick).toHaveBeenCalled()
  })

  it('does not render secondary button when not provided', () => {
    const { queryByText } = renderDialog({ secondaryButton: undefined })
    expect(queryByText('Close')).toBeFalsy()
  })

  it('renders with left text alignment', () => {
    const { getByText } = renderDialog({ textAlign: 'left' })
    const subtext = getByText('Mock Subtext')
    expect(subtext).toBeTruthy()
  })

  it('renders with icon background', () => {
    const { getByText } = renderDialog({ hasIconBackground: true, icon: <Text>Icon With Background</Text> })
    // Verify the icon renders (the background styling is present in web but hard to assert in RN test renderer)
    expect(getByText('Icon With Background')).toBeTruthy()
  })

  it('renders children content when provided', () => {
    const childContent = (
      <Flex testID="custom-content">
        <Text>Custom Content</Text>
      </Flex>
    )
    const { getByTestId } = renderDialog({ children: childContent })
    expect(getByTestId('custom-content')).toBeTruthy()
  })

  it('renders ReactNode title and subtext', () => {
    const customTitle = <Text testID="custom-title">Custom Title</Text>
    const customSubtext = <Text testID="custom-subtext">Custom Subtext</Text>

    const { getByTestId } = renderDialog({
      title: customTitle,
      subtext: customSubtext,
    })

    expect(getByTestId('custom-title')).toBeTruthy()
    expect(getByTestId('custom-subtext')).toBeTruthy()
  })

  describe('dialog visibility preferences', () => {
    let mockService: jest.Mocked<DialogPreferencesService>

    beforeEach(() => {
      mockService = {
        shouldShowDialog: jest.fn(),
        markDialogHidden: jest.fn(),
        resetDialog: jest.fn(),
      }
      jest.clearAllMocks()
      // Clear React Query cache to prevent test pollution
      SharedQueryClient.clear()
    })

    it('automatically closes when shouldShow is false', async () => {
      // This service returns false, indicating the user has saved a preference to "don't show again"
      mockService.shouldShowDialog.mockResolvedValue(false)
      const onCloseSpy = jest.fn()

      const { queryByText } = renderWithProviders(
        <Dialog
          isOpen={true}
          icon={<Text>Icon</Text>}
          title="Test Title"
          subtext="Test Subtext"
          modalName={ModalName.Dialog}
          primaryButton={{ text: 'Primary', onPress: mockPrimaryClick }}
          visibilityId={DialogVisibilityId.StorybookExample}
          dialogPreferencesService={mockService}
          onClose={onCloseSpy}
        />,
      )

      // onClose should be called once when shouldShow is false
      await waitFor(() => {
        expect(onCloseSpy).toHaveBeenCalledTimes(1)
      })

      // Dialog should not render when shouldShow is false
      expect(queryByText('Test Title')).toBeFalsy()
    })

    it('does not call onClose multiple times if shouldShow remains false', async () => {
      mockService.shouldShowDialog.mockResolvedValue(false)
      const onCloseSpy = jest.fn()

      const { rerender } = renderWithProviders(
        <Dialog
          isOpen={true}
          icon={<Text>Icon</Text>}
          title="Test Title"
          subtext="Test Subtext"
          modalName={ModalName.Dialog}
          primaryButton={{ text: 'Primary', onPress: mockPrimaryClick }}
          visibilityId={DialogVisibilityId.StorybookExample}
          dialogPreferencesService={mockService}
          onClose={onCloseSpy}
        />,
      )

      await waitFor(() => {
        expect(onCloseSpy).toHaveBeenCalledTimes(1)
      })

      // Force a re-render with same props
      rerender(
        <Dialog
          isOpen={true}
          icon={<Text>Icon</Text>}
          title="Test Title"
          subtext="Test Subtext"
          modalName={ModalName.Dialog}
          primaryButton={{ text: 'Primary', onPress: mockPrimaryClick }}
          visibilityId={DialogVisibilityId.StorybookExample}
          dialogPreferencesService={mockService}
          onClose={onCloseSpy}
        />,
      )

      // onClose should still only be called once
      expect(onCloseSpy).toHaveBeenCalledTimes(1)
    })

    it('renders normally when shouldShow is true', async () => {
      mockService.shouldShowDialog.mockResolvedValue(true)
      const onCloseSpy = jest.fn()

      const { getByText } = renderWithProviders(
        <Dialog
          isOpen={true}
          icon={<Text>Icon</Text>}
          title="Test Title"
          subtext="Test Subtext"
          modalName={ModalName.Dialog}
          primaryButton={{ text: 'Primary', onPress: mockPrimaryClick }}
          visibilityId={DialogVisibilityId.StorybookExample}
          dialogPreferencesService={mockService}
          onClose={onCloseSpy}
        />,
      )

      // Dialog should render when shouldShow is true
      await waitFor(() => {
        expect(getByText('Test Title')).toBeTruthy()
      })

      // onClose should NOT be called automatically
      expect(onCloseSpy).not.toHaveBeenCalled()
    })

    it('does not call onClose when dialog is already closed (isOpen=false)', async () => {
      mockService.shouldShowDialog.mockResolvedValue(false)
      const onCloseSpy = jest.fn()

      renderWithProviders(
        <Dialog
          isOpen={false}
          icon={<Text>Icon</Text>}
          title="Test Title"
          subtext="Test Subtext"
          modalName={ModalName.Dialog}
          primaryButton={{ text: 'Primary', onPress: mockPrimaryClick }}
          visibilityId={DialogVisibilityId.StorybookExample}
          dialogPreferencesService={mockService}
          onClose={onCloseSpy}
        />,
      )

      // onClose should not be called since the dialog is already closed
      expect(onCloseSpy).not.toHaveBeenCalled()
    })
  })
})
