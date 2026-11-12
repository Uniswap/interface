import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlainImage } from './PlainImage'

const BROKEN_URI = 'https://example.com/broken.png'
const VALID_URI = 'https://example.com/valid.png'

const fallback = <div data-testid="fallback" />
const size = { width: 20, height: 20 }

describe('PlainImage', () => {
  it('shows the fallback when the image fails to load', () => {
    render(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={BROKEN_URI} />)

    fireEvent.error(screen.getByRole('img'))

    expect(screen.getByTestId('fallback')).toBeDefined()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('retries when a new uri is provided after an error', () => {
    const { rerender } = render(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={BROKEN_URI} />)

    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).toBeNull()

    rerender(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={VALID_URI} />)

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe(VALID_URI)
  })

  it('retries a previously failed uri after switching away from it', () => {
    const { rerender } = render(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={BROKEN_URI} />)

    fireEvent.error(screen.getByRole('img'))

    rerender(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={VALID_URI} />)
    expect(screen.getByRole('img').getAttribute('src')).toBe(VALID_URI)

    rerender(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={BROKEN_URI} />)
    expect(screen.getByRole('img').getAttribute('src')).toBe(BROKEN_URI)
  })

  it('remounts the img when the uri changes so stale error events cannot mark the new uri', () => {
    const { rerender } = render(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={BROKEN_URI} />)

    const firstImg = screen.getByRole('img')

    rerender(<PlainImage alt="Token logo" fallback={fallback} size={size} uri={VALID_URI} />)

    const secondImg = screen.getByRole('img')
    expect(secondImg).not.toBe(firstImg)

    // error queued for the old src fires against the detached element; the new uri is unaffected
    fireEvent.error(firstImg)
    expect(screen.getByRole('img').getAttribute('src')).toBe(VALID_URI)
  })
})
