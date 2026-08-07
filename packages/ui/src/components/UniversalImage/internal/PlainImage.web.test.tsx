import { fireEvent, render, screen } from '@testing-library/react'
import { PlainImage } from 'ui/src/components/UniversalImage/internal/PlainImage'
import { SharedUIUniswapProvider } from 'ui/src/test/render'
import { describe, expect, it } from 'vitest'

const BROKEN_URI = 'https://example.com/broken.png'
const VALID_URI = 'https://example.com/valid.png'

const fallback = <div data-testid="fallback" />
const size = { width: 20, height: 20 }

describe('PlainImage', () => {
  it('shows the fallback when the image fails to load', () => {
    render(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={BROKEN_URI} />
      </SharedUIUniswapProvider>,
    )

    fireEvent.error(screen.getByRole('img'))

    expect(screen.getByTestId('fallback')).toBeDefined()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('retries when a new uri is provided after an error', () => {
    const { rerender } = render(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={BROKEN_URI} />
      </SharedUIUniswapProvider>,
    )

    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).toBeNull()

    rerender(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={VALID_URI} />
      </SharedUIUniswapProvider>,
    )

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe(VALID_URI)
  })

  it('retries a previously failed uri after switching away from it', () => {
    const { rerender } = render(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={BROKEN_URI} />
      </SharedUIUniswapProvider>,
    )

    fireEvent.error(screen.getByRole('img'))

    rerender(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={VALID_URI} />
      </SharedUIUniswapProvider>,
    )
    expect(screen.getByRole('img').getAttribute('src')).toBe(VALID_URI)

    rerender(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={BROKEN_URI} />
      </SharedUIUniswapProvider>,
    )
    expect(screen.getByRole('img').getAttribute('src')).toBe(BROKEN_URI)
  })

  it('remounts the img when the uri changes so stale error events cannot mark the new uri', () => {
    const { rerender } = render(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={BROKEN_URI} />
      </SharedUIUniswapProvider>,
    )

    const firstImg = screen.getByRole('img')

    rerender(
      <SharedUIUniswapProvider>
        <PlainImage fallback={fallback} size={size} uri={VALID_URI} />
      </SharedUIUniswapProvider>,
    )

    const secondImg = screen.getByRole('img')
    expect(secondImg).not.toBe(firstImg)

    // error queued for the old src fires against the detached element; the new uri is unaffected
    fireEvent.error(firstImg)
    expect(screen.getByRole('img').getAttribute('src')).toBe(VALID_URI)
  })
})
