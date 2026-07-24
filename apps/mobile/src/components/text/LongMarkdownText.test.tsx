import React from 'react'
import Markdown, { MarkdownProps } from 'react-native-markdown-display'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { fireEvent, render, within } from 'src/test/test-utils'
import { fonts } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { Mock } from 'vitest'

const TEXT_VARIANT = 'body2'
const LINE_HEIGHT = fonts[TEXT_VARIANT].lineHeight

const SHORT_TEXT = 'Short text'
const LONG_TEXT = 'Some very long text'

vi.mock('react-native-markdown-display', async () => {
  const Markdown = (
    await vi.importActual<{ default: React.ComponentType<MarkdownProps> }>('react-native-markdown-display')
  ).default

  return {
    __esModule: true, // this property makes Markdown renderering work in the es module
    default: vi.fn().mockImplementation((props: MarkdownProps) => <Markdown {...props} />),
  }
})

/**
 * The component measures itself once, from the first onLayout event it receives. Under
 * vitest/jsdom that first event is fired synchronously on mount by tamagui, measured via
 * getBoundingClientRect (always a zero rect in jsdom). Stub getBoundingClientRect before
 * rendering so that mount-time measurement carries realistic heights, like on a device:
 * the hidden one-line measurer reports a single line height and the markdown wrapper
 * reports the given number of content lines.
 */
let boundingRectSpy: ReturnType<typeof vi.spyOn> | undefined

const mockContentHeight = (contentLines: number): void => {
  const makeRect = (height: number): DOMRect => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 100,
    bottom: height,
    width: 100,
    height,
    toJSON: (): unknown => ({}),
  })

  boundingRectSpy = vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element): DOMRect {
      if (this.getAttribute('data-testid') === 'markdown-wrapper') {
        return makeRect(contentLines * LINE_HEIGHT)
      }
      if (this.parentElement?.getAttribute('data-testid') === 'markdown-wrapper') {
        // the hidden one-line markdown used to measure a single text line's height
        return makeRect(LINE_HEIGHT)
      }
      return makeRect(0)
    })
}

const renderMarkdown = (text: string, contentLines: number): ReturnType<typeof render> => {
  mockContentHeight(contentLines)
  return render(<LongMarkdownText initialDisplayedLines={3} text={text} variant={TEXT_VARIANT} />)
}

const getMarkdownPropsWithHeight = (height: number | 'auto'): any =>
  expect.objectContaining({
    style: expect.objectContaining({
      body: expect.objectContaining({
        height, // height auto means the text doesn't exceed the limit
      }),
    }),
  })

describe(LongMarkdownText, () => {
  const MockedMarkdown = Markdown as unknown as Mock

  afterEach(() => {
    boundingRectSpy?.mockRestore()
    boundingRectSpy = undefined
  })

  it('renders without error', () => {
    const tree = renderMarkdown(LONG_TEXT, 5)

    expect(tree).toMatchSnapshot()
  })

  describe('short text not exceeding the limit', () => {
    it('shows the entire text', () => {
      renderMarkdown(SHORT_TEXT, 1) // Assume Short text is one line

      // props are at index 0, ref is at index 1
      expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
        getMarkdownPropsWithHeight('auto'), // height auto means the text doesn't exceed the limit
      )
    })

    it('does not display the "read more" button', () => {
      const tree = renderMarkdown(SHORT_TEXT, 1) // Assume Short text is one line

      const readMoreButton = tree.queryByTestId(TestID.ReadMoreButton)

      expect(readMoreButton).toBeNull()
    })
  })

  describe('long text exceeding the limit', () => {
    describe('when the text is not expanded', () => {
      it('limits the number of visible lines', () => {
        renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
          getMarkdownPropsWithHeight(LINE_HEIGHT * 3), // Height is limited to 3 lines
        )
      })

      it('displays the "read more" button', () => {
        const tree = renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.queryByTestId(TestID.ReadMoreButton)

        expect(readMoreButton).toBeTruthy()
        expect(within(readMoreButton!).getByText('common.longText.button.more')).toBeTruthy()
      })
    })

    describe('when the text is expanded', () => {
      it('shows the entire text', () => {
        const tree = renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.getByTestId(TestID.ReadMoreButton)
        fireEvent.press(readMoreButton)

        expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
          getMarkdownPropsWithHeight('auto'), // height auto means the text doesn't exceed the limit
        )
      })

      it('displays the "read less" button', () => {
        const tree = renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.getByTestId(TestID.ReadMoreButton)
        fireEvent.press(readMoreButton)

        expect(readMoreButton).toBeTruthy()

        expect(within(readMoreButton!).getByText('common.longText.button.less')).toBeTruthy()
      })
    })

    it('toggles the text when the "read more/less" button is pressed', () => {
      const tree = renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

      const readMoreButton = tree.getByTestId(TestID.ReadMoreButton)
      fireEvent.press(readMoreButton) // expand

      expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
        getMarkdownPropsWithHeight('auto'), // height auto means the text doesn't exceed the limit
      )

      fireEvent.press(readMoreButton) // collapse

      expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
        getMarkdownPropsWithHeight(LINE_HEIGHT * 3), // Height is limited to 3 lines
      )
    })
  })
})
