import { fireEvent, render } from '@testing-library/react'
import { createElement, forwardRef } from 'react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import type { ImageRequireSource } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireImage as RequireImageNative } from './internal/RequireImage.native'
import { RequireImage as RequireImageWeb } from './internal/RequireImage.web'
import { SvgImage } from './internal/SvgImage.native'
import { UniversalImage } from './UniversalImage'
import { useSvgData } from './utils'

vi.mock('./utils', () => ({
  useSvgData: vi.fn(),
}))

// SvgImage.native mounts a bare RN View wrapper; react-native's Flow sources
// don't parse in this jsdom config, so forward it to a div carrying the props.
vi.mock('react-native', () => ({
  View: ({ style, children }: { style?: CSSProperties; children?: ReactNode }) =>
    createElement('div', { style }, children),
  Image: { getSize: (): void => undefined },
}))

// SvgImage.native imports WebView as the default export; provide a
// prop-forwarding iframe so the wrapper/WebView styles stay assertable.
vi.mock('react-native-webview', () => {
  const MockWebView = forwardRef((props: object, ref: Ref<HTMLIFrameElement>) =>
    createElement('iframe', { ...props, ref }),
  )
  return { default: MockWebView, WebView: MockWebView }
})

// expo-image is a native-only dependency (its real module requires expo-modules-core native
// bindings, unavailable in jsdom), so pin RequireImage.native against a prop-forwarding stand-in.
// onError is exposed as a click handler so tests can drive the error path.
vi.mock('expo-image', () => ({
  Image: ({ source, style, onError }: { source: number; style?: CSSProperties; onError?: () => void }) =>
    createElement('div', {
      'data-testid': 'expo-image',
      'data-source': String(source),
      style,
      onClick: onError,
    }),
}))

const mockedUseSvgData = vi.mocked(useSvgData)

const SVG_URI = 'https://example.com/image.svg'
const PNG_URI = 'https://example.com/image.png'
const SVG_DATA = { content: '<svg viewBox="0 0 20 10"></svg>', aspectRatio: 2 }

/**
 * Reads a style declaration off a rendered element. The RN styles under test are
 * runtime-dynamic objects resolved to inline styles, so this pins the exact declarations
 * the component wrote rather than anything inherited from a stylesheet. jsdom's CSSOM
 * does not implement `aspect-ratio` (React cannot write it to the DOM there), so when the
 * inline read comes back empty this falls back to the style object React passed to the
 * host element — the same resolved declaration, pre-CSSOM.
 */
function renderedStyle(element: Element, property: string): string {
  const style = (element as HTMLElement).style
  if (property === 'border-radius') {
    return style.getPropertyValue('border-top-left-radius') || style.getPropertyValue('border-radius')
  }
  const inline = style.getPropertyValue(property)
  if (inline !== '') {
    return inline
  }
  const propsKey = Object.keys(element).find((key) => key.startsWith('__reactProps'))
  const hostProps = propsKey
    ? (element as unknown as Record<string, { style?: Record<string, unknown> }>)[propsKey]
    : undefined
  const camelCased = property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
  const value = hostProps?.style?.[camelCased]
  return value === undefined ? '' : String(value)
}

// Source-level regression pin for the NATIVE-SOURCE modules, executed in the web test lane
// (jsdom — mycelium has no native-runtime test lane of its own; the tailwind native parity
// harness covers resolved-style parity). It imports SvgImage.native and RequireImage.native
// explicitly and pins the RN style objects: the WebView wrapper, the shared loading-container
// branch, and both legs of the platform-split require-source branch. If a style key is
// dropped, these fail. This is NOT native-runtime verification (no Yoga layout, no real
// WebView, no real expo-image) — on-device verification is device evidence on the PRs.
describe('SvgImage (native) WebView wrapper', () => {
  beforeEach(() => {
    mockedUseSvgData.mockReturnValue(SVG_DATA)
  })

  it('wraps the WebView in a View carrying the explicit aspect ratio and height cap', () => {
    const { container } = render(
      <SvgImage alt="" autoplay={false} size={{ height: 40, aspectRatio: 3 }} uri={SVG_URI} />,
    )

    const wrapper = container.querySelector('iframe')?.parentElement
    expect(wrapper).not.toBeNull()
    expect(renderedStyle(wrapper as Element, 'aspect-ratio'), 'aspect-ratio').toBe('3')
    expect(renderedStyle(wrapper as Element, 'max-height'), 'max-height').toBe('40px')
  })

  it('falls back to the svg intrinsic aspect ratio and an unbounded height', () => {
    const { container } = render(<SvgImage alt="" autoplay={false} size={{}} uri={SVG_URI} />)

    const wrapper = container.querySelector('iframe')?.parentElement
    expect(renderedStyle(wrapper as Element, 'aspect-ratio'), 'aspect-ratio').toBe('2')
    expect(renderedStyle(wrapper as Element, 'max-height'), 'max-height').toBe('100%')
  })

  it('sizes the WebView to fill the wrapper with a transparent background', () => {
    const { container } = render(<SvgImage alt="" autoplay={false} size={{ height: 40 }} uri={SVG_URI} />)

    // The test setup mocks react-native-webview's WebView as an iframe that forwards props
    const webView = container.querySelector('iframe')
    expect(webView).not.toBeNull()
    expect(renderedStyle(webView as Element, 'aspect-ratio'), 'aspect-ratio').toBe('2')
    expect(renderedStyle(webView as Element, 'height'), 'height').toBe('100%')
    expect(renderedStyle(webView as Element, 'width'), 'width').toBe('100%')
    expect(renderedStyle(webView as Element, 'background-color'), 'background-color').toBe('transparent')
  })

  it('renders the fallback instead of a WebView when svg data is unavailable', () => {
    mockedUseSvgData.mockReturnValue(undefined)

    const { container, getByTestId } = render(
      <SvgImage
        alt=""
        autoplay={false}
        fallback={<div data-testid="svg-fallback" />}
        size={{ height: 40 }}
        uri={SVG_URI}
      />,
    )

    expect(getByTestId('svg-fallback')).toBeDefined()
    expect(container.querySelector('iframe')).toBeNull()
  })
})

describe('UniversalImage branches shared with native', () => {
  it('renders the loading container with the caller style and loading-prefixed testID', () => {
    const { getByTestId } = render(
      <UniversalImage
        alt=""
        size={{}}
        style={{ loadingContainer: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' } }}
        testID="native"
      />,
    )

    const loadingContainer = getByTestId('loading-native')
    expect(renderedStyle(loadingContainer, 'width'), 'width').toBe('40px')
    expect(renderedStyle(loadingContainer, 'height'), 'height').toBe('40px')
    expect(renderedStyle(loadingContainer, 'border-radius'), 'border-radius').toBe('12px')
    expect(loadingContainer.hasChildNodes(), 'contains the loader').toBe(true)
  })

  it('renders the bare loader without a container when no loadingContainer style is given', () => {
    const { queryByTestId } = render(<UniversalImage alt="" size={{}} testID="native" />)

    expect(queryByTestId('loading-native')).toBeNull()
  })

  it('renders a require-source uri through RequireImage (web leg: blank sized block) from the size prop', () => {
    const { container } = render(
      <UniversalImage alt="" size={{ width: 20, height: 24 }} uri={137 as ImageRequireSource} />,
    )

    const image = container.firstElementChild
    expect(image).not.toBeNull()
    expect(renderedStyle(image as Element, 'width'), 'width').toBe('20px')
    expect(renderedStyle(image as Element, 'height'), 'height').toBe('24px')
  })

  it('the web require-source leg renders the sized block forwarding the caller image style', () => {
    const { container } = render(
      <RequireImageWeb
        alt=""
        size={{ width: 20, height: 24 }}
        style={{ borderRadius: 20, zIndex: 1 }}
        uri={137 as ImageRequireSource}
      />,
    )

    const image = container.firstElementChild
    expect(renderedStyle(image as Element, 'width'), 'width').toBe('20px')
    expect(renderedStyle(image as Element, 'height'), 'height').toBe('24px')
    expect(renderedStyle(image as Element, 'z-index'), 'z-index').toBe('1')
    expect(renderedStyle(image as Element, 'border-radius'), 'border-radius').toBe('20px')
  })

  it('renders the native require-source leg through ExpoImage with the numeric source sized from the size prop', () => {
    const { getByTestId } = render(
      <RequireImageNative alt="" size={{ width: 20, height: 24 }} uri={137 as ImageRequireSource} />,
    )

    const image = getByTestId('expo-image')
    expect(image.dataset['source'], 'source').toBe('137')
    expect(renderedStyle(image, 'width'), 'width').toBe('20px')
    expect(renderedStyle(image, 'height'), 'height').toBe('24px')
  })

  it('forwards the caller image style so the logo stacks above sibling background layers', () => {
    // TokenLogo raises the image above its white background circle via style.image
    // (zIndex + borderRadius); dropping it left a blank white circle over the logo
    const { getByTestId } = render(
      <RequireImageNative
        alt=""
        size={{ width: 20, height: 24 }}
        style={{ borderRadius: 20, zIndex: 1 }}
        uri={137 as ImageRequireSource}
      />,
    )

    const image = getByTestId('expo-image')
    expect(renderedStyle(image, 'z-index'), 'z-index').toBe('1')
    expect(renderedStyle(image, 'border-radius'), 'border-radius').toBe('20px')
  })

  it('renders the fallback and reports onError when the native require-source load errors', () => {
    const onError = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <RequireImageNative
        alt=""
        fallback={<div data-testid="require-fallback" />}
        size={{ width: 20, height: 24 }}
        uri={137 as ImageRequireSource}
        onError={onError}
      />,
    )

    fireEvent.click(getByTestId('expo-image'))

    expect(getByTestId('require-fallback')).toBeDefined()
    expect(queryByTestId('expo-image')).toBeNull()
    expect(onError).toHaveBeenCalledTimes(1)
  })
})
