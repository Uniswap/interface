import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

describe('ExpandoRow', () => {
  const mockOnPress = vi.fn()
  const defaultProps = {
    isExpanded: false,
    onPress: mockOnPress,
    label: 'Test Label',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('matches snapshot when collapsed', () => {
    const { toJSON } = render(<ExpandoRow {...defaultProps} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('matches snapshot when expanded', () => {
    const { toJSON } = render(<ExpandoRow {...defaultProps} isExpanded={true} />)
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly when collapsed', () => {
    render(<ExpandoRow {...defaultProps} />)

    // Check if the label is rendered
    expect(screen.getByText('Test Label')).toBeTruthy()

    // Check if the component has the correct structure
    expect(screen.getByTestId(TestID.ExpandoRow)).toBeTruthy()
    expect(screen.getByTestId(TestID.ExpandoRowLabel)).toBeTruthy()
    expect(screen.getByTestId(TestID.ExpandoRowIcon)).toBeTruthy()
  })

  it('renders correctly when expanded', () => {
    render(<ExpandoRow {...defaultProps} isExpanded={true} />)

    // Check if the label is rendered
    expect(screen.getByText('Test Label')).toBeTruthy()

    // Check if the component has the correct structure
    expect(screen.getByTestId(TestID.ExpandoRow)).toBeTruthy()
    expect(screen.getByTestId(TestID.ExpandoRowLabel)).toBeTruthy()
    expect(screen.getByTestId(TestID.ExpandoRowIcon)).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    render(<ExpandoRow {...defaultProps} />)

    // Find and press the TouchableArea using testID
    const touchableArea = screen.getByTestId(TestID.ExpandoRow)
    fireEvent.press(touchableArea, {
      nativeEvent: {
        pageX: 0,
        pageY: 0,
        locationX: 0,
        locationY: 0,
        timestamp: 0,
        target: 0,
        identifier: 0,
      },
    })
    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  it('displays the correct label', () => {
    const customLabel = 'Custom Label'
    render(<ExpandoRow {...defaultProps} label={customLabel} />)

    expect(screen.getByText(customLabel)).toBeTruthy()
  })

  it('supports a larger label variant', (): void => {
    const { rerender } = render(<ExpandoRow {...defaultProps} />)
    const defaultLabelClass = (screen.getByTestId(TestID.ExpandoRowLabel) as unknown as HTMLElement).className

    rerender(<ExpandoRow {...defaultProps} labelVariant="body2" />)

    expect((screen.getByTestId(TestID.ExpandoRowLabel) as unknown as HTMLElement).className).not.toBe(defaultLabelClass)
  })
})
