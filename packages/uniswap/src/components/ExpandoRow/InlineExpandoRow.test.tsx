import { Text } from 'ui/src'
import { InlineExpandoRow } from 'uniswap/src/components/ExpandoRow/InlineExpandoRow'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

describe('InlineExpandoRow', () => {
  const mockOnPress = vi.fn()
  const defaultProps = {
    isExpanded: false,
    onPress: mockOnPress,
    label: 'Hidden (3)',
    testID: 'inline-expando',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the label and chevron icon', () => {
    render(<InlineExpandoRow {...defaultProps} />)

    expect(screen.getByText('Hidden (3)')).toBeTruthy()
    expect(screen.getByTestId('inline-expando')).toBeTruthy()
    expect(screen.getByTestId('expando-row-icon')).toBeTruthy()
  })

  it('calls onPress when the row is pressed', () => {
    render(<InlineExpandoRow {...defaultProps} />)

    fireEvent.press(screen.getByTestId('inline-expando'))

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  it('renders body content when isExpanded is true and a body is provided', () => {
    render(<InlineExpandoRow {...defaultProps} isExpanded={true} body={<Text>body-content</Text>} />)

    expect(screen.getByText('body-content')).toBeTruthy()
  })

  it('does not render body content when body prop is omitted', () => {
    render(<InlineExpandoRow {...defaultProps} isExpanded={true} />)

    expect(screen.queryByText('body-content')).toBeNull()
  })
})
