import { describe, expect, it } from 'vitest'
import { getBidDescription } from '~/features/Toucan/Auction/utils/bidDescription'
import { render } from '~/test-utils/render'

// Nested so the inner tag is minted in the SVG namespace, where <script href> is a real script source.
const HOSTILE_SYMBOL = '<highlight tag=svg><highlight tag=script href="/entry-gateway/x"/></highlight>'

describe('getBidDescription untrusted interpolation', () => {
  it('renders a markup-bearing token symbol as inert text (inRangeInProgress)', () => {
    const { container } = render(
      <>
        {getBidDescription({
          descriptionState: 'inRangeInProgress',
          tokenSymbol: HOSTILE_SYMBOL,
          valuationSummary: '1M USDC',
        })}
      </>,
    )
    expect(container.querySelector('script, svg, [href]')).toBeNull()
    expect(container.textContent).toContain('<highlight tag=svg>')
  })

  it('renders a markup-bearing valuation summary as inert text (outOfRangeInProgress)', () => {
    const { container } = render(
      <>
        {getBidDescription({
          descriptionState: 'outOfRangeInProgress',
          tokenSymbol: 'UNI',
          valuationSummary: `1M ${HOSTILE_SYMBOL}`,
        })}
      </>,
    )
    expect(container.querySelector('script, svg, [href]')).toBeNull()
    expect(container.textContent).toContain('<highlight tag=svg>')
  })

  it('round-trips entity characters in honest values', () => {
    const { container } = render(
      <>
        {getBidDescription({
          descriptionState: 'inRangeInProgress',
          tokenSymbol: 'AT&T',
          valuationSummary: '<$0.01',
        })}
      </>,
    )
    expect(container.textContent).toContain('AT&T')
    expect(container.textContent).toContain('<$0.01')
    expect(container.textContent).not.toContain('&amp;')
  })
})
