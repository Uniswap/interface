import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

describe('ExpandoRow', () => {
  const mockOnPress = jest.fn()
  const defaultProps = {
    isExpanded: false,
    onPress: mockOnPress,
    label: 'Test Label',
  }

  beforeEach(() => {
    jest.clearAllMocks()
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
    expect(screen.getByTestId('expando-row')).toBeTruthy()
    expect(screen.getByTestId('expando-row-label')).toBeTruthy()
    expect(screen.getByTestId('expando-row-icon')).toBeTruthy()
  })

  it('renders correctly when expanded', () => {
    render(<ExpandoRow {...defaultProps} isExpanded={true} />)

    // Check if the label is rendered
    expect(screen.getByText('Test Label')).toBeTruthy()

    // Check if the component has the correct structure
    expect(screen.getByTestId('expando-row')).toBeTruthy()
    expect(screen.getByTestId('expando-row-label')).toBeTruthy()
    expect(screen.getByTestId('expando-row-icon')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    render(<ExpandoRow {...defaultProps} />)

    // Find and press the TouchableArea using testID
    const touchableArea = screen.getByTestId('expando-row')
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
})
