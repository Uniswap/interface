import { CloseButton } from 'src/components/buttons/CloseButton'
import { fireEvent, render } from 'src/test/test-utils'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'

describe(CloseButton, () => {
  it('renders without error', () => {
    const tree = render(<CloseButton onPress={jest.fn()} />)

    expect(tree).toMatchSnapshot()
  })

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn()
    const { getByTestId } = render(<CloseButton onPress={onPress} />)

    const button = getByTestId('buttons/close-button')
    fireEvent.press(button, ON_PRESS_EVENT_PAYLOAD)

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
