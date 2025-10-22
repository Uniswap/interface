import { fireEvent } from '@testing-library/react-native'
import { Flex, Text } from 'ui/src'
import { Dialog } from 'uniswap/src/components/dialog/Dialog.web'
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
        primaryButtonText="Primary Button"
        primaryButtonOnClick={mockPrimaryClick}
        secondaryButtonText="Close"
        secondaryButtonOnClick={mockOnClose}
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
      secondaryButtonText: 'Secondary Button',
      secondaryButtonOnClick: mockSecondaryClick,
    })

    fireEvent.press(getByText('Secondary Button'))
    expect(mockSecondaryClick).toHaveBeenCalled()
  })

  it('does not render secondary button when not provided', () => {
    const { queryByText } = renderDialog({ secondaryButtonText: undefined })
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
})
