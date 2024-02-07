import React from 'react'
import { MarkdownProps } from 'react-native-markdown-display'
import { ReactTestInstance } from 'react-test-renderer'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { fireEvent, render, within } from 'src/test/test-utils'
import { fonts } from 'ui/src/theme'

const TEXT_VARIANT = 'body2'
const LINE_HEIGHT = fonts[TEXT_VARIANT].lineHeight

const SHORT_TEXT = 'Short text'
const LONG_TEXT = 'Some very long text'

jest.mock('react-native-markdown-display', () => {
  const Markdown = jest.requireActual('react-native-markdown-display').default

  return {
    __esModule: true, // this property makes Markdown renderering work in the es module
    default: jest.fn().mockImplementation((props: MarkdownProps) => <Markdown {...props} />),
  }
})

const fireLayoutEvent = (instance: ReactTestInstance, lines: number): void => {
  const height = lines * LINE_HEIGHT

  fireEvent(instance, 'layout', {
    nativeEvent: {
      layout: {
        height,
        width: 100,
      },
    },
  })
}

const renderMarkdown = (text: string): ReturnType<typeof render> =>
  render(<LongMarkdownText initialDisplayedLines={3} text={text} variant={TEXT_VARIANT} />)

const measureMarkdown = (tree: ReturnType<typeof render>, numberOfLines: number): void => {
  const markdownWrapperInstance = tree.getByTestId('markdown-wrapper')
  fireLayoutEvent(markdownWrapperInstance, numberOfLines)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMarkdownPropsWithHeight = (height: number | 'auto'): any =>
  expect.objectContaining({
    style: expect.objectContaining({
      body: expect.objectContaining({
        height, // height auto means the text doesn't exceed the limit
      }),
    }),
  })

describe(LongMarkdownText, () => {
  const MockedMarkdown = require('react-native-markdown-display').default as jest.Mock

  it('renders without error', () => {
    const tree = renderMarkdown(LONG_TEXT)

    expect(tree).toMatchSnapshot()
  })

  describe('short text not exceeding the limit', () => {
    it('shows the entire text', () => {
      const tree = renderMarkdown(SHORT_TEXT)
      measureMarkdown(tree, 1) // Assume Short text is one line

      // props are at index 0, ref is at index 1
      expect(MockedMarkdown.mock.lastCall[0]).toEqual(
        getMarkdownPropsWithHeight('auto') // height auto means the text doesn't exceed the limit
      )
    })

    it('does not display the "read more" button', () => {
      const tree = renderMarkdown(SHORT_TEXT)
      measureMarkdown(tree, 1) // Assume Short text is one line

      const readMoreButton = tree.queryByTestId('read-more-button')

      expect(readMoreButton).toBeNull()
    })
  })

  describe('long text exceeding the limit', () => {
    describe('when the text is not expanded', () => {
      it('limits the number of visible lines', () => {
        const tree = renderMarkdown(LONG_TEXT)

        measureMarkdown(tree, 5) // Assume Some very long text is five lines

        expect(MockedMarkdown.mock.lastCall[0]).toEqual(
          getMarkdownPropsWithHeight(LINE_HEIGHT * 3) // Height is limited to 3 lines
        )
      })

      it('displays the "read more" button', () => {
        const tree = renderMarkdown(LONG_TEXT)

        measureMarkdown(tree, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.queryByTestId('read-more-button')

        expect(readMoreButton).toBeTruthy()
        expect(within(readMoreButton!).getByText('Read more')).toBeTruthy()
      })
    })

    describe('when the text is expanded', () => {
      it('shows the entire text', () => {
        const tree = renderMarkdown(LONG_TEXT)

        measureMarkdown(tree, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.getByTestId('read-more-button')
        fireEvent.press(readMoreButton)

        expect(MockedMarkdown.mock.lastCall[0]).toEqual(
          getMarkdownPropsWithHeight('auto') // height auto means the text doesn't exceed the limit
        )
      })

      it('displays the "read less" button', () => {
        const tree = renderMarkdown(LONG_TEXT)

        measureMarkdown(tree, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.getByTestId('read-more-button')
        fireEvent.press(readMoreButton)

        expect(readMoreButton).toBeTruthy()

        expect(within(readMoreButton!).getByText('Read less')).toBeTruthy()
      })
    })

    it('toggles the text when the "read more/less" button is pressed', () => {
      const tree = renderMarkdown(LONG_TEXT)

      measureMarkdown(tree, 5) // Assume Some very long text is five lines

      const readMoreButton = tree.getByTestId('read-more-button')
      fireEvent.press(readMoreButton) // expand

      expect(MockedMarkdown.mock.lastCall[0]).toEqual(
        getMarkdownPropsWithHeight('auto') // height auto means the text doesn't exceed the limit
      )

      fireEvent.press(readMoreButton) // collapse

      expect(MockedMarkdown.mock.lastCall[0]).toEqual(
        getMarkdownPropsWithHeight(LINE_HEIGHT * 3) // Height is limited to 3 lines
      )
    })
  })
})
