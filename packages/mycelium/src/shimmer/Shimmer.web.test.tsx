import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
// Explicit extension pins the platformless stub file itself — the extensionless
// specifier resolves to the web leg under this config's .web-first resolver.
import { Shimmer as ShimmerStub } from './Shimmer.tsx'
import { Shimmer } from './Shimmer.web'

describe('Shimmer (web)', () => {
  it('sweeps the legacy Shine mask over the children by default', () => {
    const html = renderToStaticMarkup(
      <Shimmer>
        <span>placeholder</span>
      </Shimmer>,
    )
    expect(html).toContain('<span>placeholder</span>')
    expect(html).toContain(
      '-webkit-mask-image:linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)',
    )
    expect(html).toContain('-webkit-mask-size:200%')
    expect(html).toContain('animation-name:myc-shimmer')
    expect(html).toContain('animation-duration:1s')
    expect(html).toContain('animation-timing-function:linear')
    expect(html).toContain('animation-iteration-count:infinite')
  })

  it('honors shimmerDurationSeconds', () => {
    const html = renderToStaticMarkup(<Shimmer shimmerDurationSeconds={2.5}>x</Shimmer>)
    expect(html).toContain('animation-duration:2.5s')
  })

  it('applies animationDelay to the sweep, and drops it with the effect when disabled', () => {
    expect(renderToStaticMarkup(<Shimmer animationDelay="0.2s">x</Shimmer>)).toContain('animation-delay:0.2s')
    expect(renderToStaticMarkup(<Shimmer>x</Shimmer>)).not.toContain('animation-delay')
    expect(
      renderToStaticMarkup(
        <Shimmer disabled animationDelay="0.2s">
          x
        </Shimmer>,
      ),
    ).not.toContain('animation-delay')
  })

  it('keeps children mounted without the effect when disabled', () => {
    const html = renderToStaticMarkup(
      <Shimmer disabled>
        <span>placeholder</span>
      </Shimmer>,
    )
    expect(html).toContain('<span>placeholder</span>')
    expect(html).not.toContain('animation-name')
    expect(html).not.toContain('mask-image')
  })

  it('merges className onto the wrapper (caller wins via cn)', () => {
    const html = renderToStaticMarkup(<Shimmer className="w-full flex-row">x</Shimmer>)
    expect(html).toContain('w-full')
    expect(html).toContain('flex-row')
    expect(html).not.toContain('flex-col')
  })

  it('platformless base stub throws until a platform override resolves', () => {
    expect(() => ShimmerStub({ children: null })).toThrow(
      'Shimmer not implemented. Did you forget a platform override?',
    )
  })
})
