import React from 'react'
import { ReactTestInstance } from 'react-test-renderer'
import { LongText } from 'src/components/text/LongText'
import { fireEvent, render, within } from 'src/test/test-utils'

const SHORT_TEXT = 'Short text'
const LONG_TEXT = 'Some very long text'

const fireTextLayoutEvent = (instance: ReactTestInstance, lines: number): void => {
  fireEvent(instance, 'textLayout', {
    nativeEvent: {
      lines: Array.from({ length: lines }).map(() => ({
        width: 100,
        height: 20,
        ascender: 20,
      })),
    },
  })
}

describe(LongText, () => {
  it('renders without error', () => {
    const tree = render(<LongText text={LONG_TEXT} />)

    expect(tree).toMatchSnapshot()
  })

  describe('short text not exceeding the limit', () => {
    it('shows the entire text', () => {
      const tree = render(<LongText initialDisplayedLines={3} text={SHORT_TEXT} />)

      const textInstance = tree.getByText(SHORT_TEXT)
      expect(textInstance.props.numberOfLines).toBeUndefined()

      fireTextLayoutEvent(textInstance, 1) // Assume Short text is one line

      // the number of lines will be the same as the initialDisplayedLines
      expect(textInstance.props.numberOfLines).toBe(3)
    })

    it('does not display the "read more" button', () => {
      const tree = render(<LongText initialDisplayedLines={3} text={SHORT_TEXT} />)

      fireTextLayoutEvent(tree.getByText(SHORT_TEXT), 1) // Assume Short text is one line
      const readMoreButton = tree.queryByTestId('read-more-button')

      expect(readMoreButton).toBeNull()
    })
  })

  describe('long text exceeding the limit', () => {
    describe('when the text is not expanded', () => {
      it('limits the number of visible lines', () => {
        const tree = render(<LongText initialDisplayedLines={3} text={LONG_TEXT} />)

        const textInstance = tree.getByText(LONG_TEXT)
        fireTextLayoutEvent(textInstance, 5) // Assume Some very long text is five lines

        expect(textInstance.props.numberOfLines).toBe(3)
      })

      it('displays the "read more" button', () => {
        const tree = render(<LongText initialDisplayedLines={3} text={LONG_TEXT} />)

        fireTextLayoutEvent(tree.getByText(LONG_TEXT), 5) // Assume Some very long text is five lines
        const readMoreButton = tree.queryByTestId('read-more-button')

        expect(readMoreButton).toBeTruthy()
        expect(within(readMoreButton!).getByText('Read more')).toBeTruthy()
      })
    })

    describe('when the text is expanded', () => {
      it('shows the entire text', () => {
        const tree = render(<LongText initialDisplayedLines={3} text={LONG_TEXT} />)

        const textInstance = tree.getByText(LONG_TEXT)
        fireTextLayoutEvent(textInstance, 5) // Assume Some very long text is five lines

        expect(textInstance.props.numberOfLines).toBe(3)

        const readMoreButton = tree.getByTestId('read-more-button')
        fireEvent.press(readMoreButton)

        expect(textInstance.props.numberOfLines).toBeUndefined()
      })

      it('displays the "read less" button', () => {
        const tree = render(<LongText initialDisplayedLines={3} text={LONG_TEXT} />)

        fireTextLayoutEvent(tree.getByText(LONG_TEXT), 5) // Assume Some very long text is five lines
        const readMoreButton = tree.getByTestId('read-more-button')
        fireEvent.press(readMoreButton)

        expect(within(readMoreButton).getByText('Read less')).toBeTruthy()
      })
    })

    it('toggles the text when the "read more/less" button is pressed', () => {
      const tree = render(<LongText initialDisplayedLines={3} text={LONG_TEXT} />)

      fireTextLayoutEvent(tree.getByText(LONG_TEXT), 5) // Assume Some very long text is five lines
      const readMoreButton = tree.getByTestId('read-more-button')
      fireEvent.press(readMoreButton) // expand

      expect(tree.getByText(LONG_TEXT).props.numberOfLines).toBeUndefined()

      fireEvent.press(readMoreButton) // collapse

      expect(tree.getByText(LONG_TEXT).props.numberOfLines).toBe(3)

      fireEvent.press(readMoreButton) // expand

      expect(tree.getByText(LONG_TEXT).props.numberOfLines).toBeUndefined()
    })
  })
})
