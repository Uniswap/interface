import { fonts } from '@universe/mycelium'
import { TestID } from '@universe/test'
import React from 'react'
import Markdown, { MarkdownProps } from 'react-native-markdown-display'
import { LongMarkdownText } from 'src/components/text/LongMarkdownText'
import { act, fireEvent, render, within } from 'src/test/test-utils'
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
 * The component measures itself once, from the first onLayout event it receives. The web
 * render lane synthesizes onLayout from a ResizeObserver entry measured via offsetHeight
 * (always 0 in jsdom). Stub offsetHeight before rendering so that mount-time measurement
 * carries realistic heights, like on a device: the hidden one-line measurer reports a
 * single line height and the markdown wrapper reports the given number of content lines.
 */
let offsetHeightSpy: ReturnType<typeof vi.spyOn> | undefined

// jsdom has no ResizeObserver; deliver one entry per observe() so mount measurement fires.
class ImmediateResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element): void {
    this.callback([{ target } as ResizeObserverEntry], this)
  }

  unobserve(): void {}

  disconnect(): void {}
}

globalThis.ResizeObserver = ImmediateResizeObserver

const mockContentHeight = (contentLines: number): void => {
  offsetHeightSpy = vi
    .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
    .mockImplementation(function (this: Element): number {
      if (this.getAttribute('data-testid') === 'markdown-wrapper') {
        return contentLines * LINE_HEIGHT
      }
      if (this.parentElement?.getAttribute('data-testid') === 'markdown-wrapper') {
        // the hidden one-line markdown used to measure a single text line's height
        return LINE_HEIGHT
      }
      return 0
    })
}

const renderMarkdown = async (text: string, contentLines: number): Promise<ReturnType<typeof render>> => {
  mockContentHeight(contentLines)
  const tree = render(<LongMarkdownText initialDisplayedLines={3} text={text} variant={TEXT_VARIANT} />)
  // The layout event's measurement is deferred a macrotask; flush it so the mount measurement lands.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return tree
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
    offsetHeightSpy?.mockRestore()
    offsetHeightSpy = undefined
  })

  it('renders without error', async () => {
    const tree = await renderMarkdown(LONG_TEXT, 5)

    expect(tree).toMatchSnapshot()
  })

  describe('short text not exceeding the limit', () => {
    it('shows the entire text', async () => {
      await renderMarkdown(SHORT_TEXT, 1) // Assume Short text is one line

      // props are at index 0, ref is at index 1
      expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
        getMarkdownPropsWithHeight('auto'), // height auto means the text doesn't exceed the limit
      )
    })

    it('does not display the "read more" button', async () => {
      const tree = await renderMarkdown(SHORT_TEXT, 1) // Assume Short text is one line

      const readMoreButton = tree.queryByTestId(TestID.ReadMoreButton)

      expect(readMoreButton).toBeNull()
    })
  })

  describe('long text exceeding the limit', () => {
    describe('when the text is not expanded', () => {
      it('limits the number of visible lines', async () => {
        await renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
          getMarkdownPropsWithHeight(LINE_HEIGHT * 3), // Height is limited to 3 lines
        )
      })

      it('displays the "read more" button', async () => {
        const tree = await renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.queryByTestId(TestID.ReadMoreButton)

        expect(readMoreButton).toBeTruthy()
        expect(within(readMoreButton!).getByText('common.longText.button.more')).toBeTruthy()
      })
    })

    describe('when the text is expanded', () => {
      it('shows the entire text', async () => {
        const tree = await renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.getByTestId(TestID.ReadMoreButton)
        fireEvent.press(readMoreButton)

        expect(MockedMarkdown.mock.lastCall?.[0]).toEqual(
          getMarkdownPropsWithHeight('auto'), // height auto means the text doesn't exceed the limit
        )
      })

      it('displays the "read less" button', async () => {
        const tree = await renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

        const readMoreButton = tree.getByTestId(TestID.ReadMoreButton)
        fireEvent.press(readMoreButton)

        expect(readMoreButton).toBeTruthy()

        expect(within(readMoreButton!).getByText('common.longText.button.less')).toBeTruthy()
      })
    })

    it('toggles the text when the "read more/less" button is pressed', async () => {
      const tree = await renderMarkdown(LONG_TEXT, 5) // Assume Some very long text is five lines

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
