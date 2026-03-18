/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StorageSettingsContent } from 'uniswap/src/features/settings/storage/StorageSettingsContent'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { fireEvent, render, waitFor } from 'uniswap/src/test/test-utils'

// Mock the WarningModal to avoid BottomSheet issues in tests
vi.mock('uniswap/src/components/modals/WarningModal/WarningModal', async () => {
  const React = await import('react')
  return {
    WarningModal: (props: { isOpen?: boolean; onAcknowledge?: () => void; acknowledgeText?: string }) => {
      if (!props.isOpen) {
        return null
      }
      return React.createElement('button', { onClick: props.onAcknowledge, type: 'button' }, props.acknowledgeText)
    },
  }
})

// Mock InfoLinkModal to avoid Modal issues
vi.mock('uniswap/src/components/modals/InfoLinkModal', () => ({
  InfoLinkModal: () => null,
}))

describe('StorageSettingsContent', () => {
  const mockOnPressClearAccountHistory = vi.fn()
  const mockOnPressClearUserSettings = vi.fn()
  const mockOnPressClearCachedData = vi.fn()
  const mockOnPressClearAllData = vi.fn()

  const defaultProps = {
    onPressClearAccountHistory: mockOnPressClearAccountHistory,
    onPressClearUserSettings: mockOnPressClearUserSettings,
    onPressClearCachedData: mockOnPressClearCachedData,
    onPressClearAllData: mockOnPressClearAllData,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const tree = render(<StorageSettingsContent {...defaultProps} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders all three storage action rows with subtitles', () => {
    const { getByText, getAllByText } = render(<StorageSettingsContent {...defaultProps} />)
    expect(getByText(/clear account history/i)).toBeTruthy()
    expect(getByText(/clear preferences/i)).toBeTruthy()
    // "Clear cache" appears in both title and subtitle, so use getAllByText
    expect(getAllByText(/clear cache/i).length).toBeGreaterThan(0)
  })

  it('calls callback when storage row is pressed and confirmed', async () => {
    const { getByText } = render(<StorageSettingsContent {...defaultProps} />)

    // Press the clear account history row
    fireEvent.press(getByText(/clear account history/i), ON_PRESS_EVENT_PAYLOAD)

    // Confirmation modal should appear - press Clear button
    await waitFor(() => {
      expect(getByText(/clear data/i)).toBeTruthy()
    })
    fireEvent.press(getByText(/clear data/i), ON_PRESS_EVENT_PAYLOAD)

    // Wait for callback to be called
    await waitFor(() => {
      expect(mockOnPressClearAccountHistory).toHaveBeenCalledTimes(1)
    })
  })

  it('calls callback when clear all data button is pressed and confirmed', async () => {
    const { getByText } = render(<StorageSettingsContent {...defaultProps} />)

    // Press the Clear all data button
    fireEvent.press(getByText(/clear all data/i), ON_PRESS_EVENT_PAYLOAD)

    // Confirmation modal should appear - press Reset button
    await waitFor(() => {
      expect(getByText(/clear data/i)).toBeTruthy()
    })
    fireEvent.press(getByText(/clear data/i), ON_PRESS_EVENT_PAYLOAD)

    // Wait for callback to be called
    await waitFor(() => {
      expect(mockOnPressClearAllData).toHaveBeenCalledTimes(1)
    })
  })
})
