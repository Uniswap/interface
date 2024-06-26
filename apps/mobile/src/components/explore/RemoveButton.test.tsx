import RemoveButton from 'src/components/explore/RemoveButton'
import { fireEvent, render } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'

describe(RemoveButton, () => {
  it('renders without error', () => {
    const tree = render(<RemoveButton />)

    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(<RemoveButton onPress={onPress} />)

    const button = getByTestId('explore/remove-button')
    fireEvent.press(button, ON_PRESS_EVENT_PAYLOAD)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  describe('visibility', () => {
    it('renders with opacity 1 when visible', () => {
      const { getByTestId } = render(<RemoveButton visible />)

      const button = getByTestId('explore/remove-button')

      expect(button).toHaveAnimatedStyle({ opacity: 1 })
    })

    it('renders with opacity 0 when not visible', () => {
      const { getByTestId } = render(<RemoveButton visible={false} />)

      const button = getByTestId('explore/remove-button')

      expect(button).toHaveAnimatedStyle({ opacity: 0 })
    })
  })
})
