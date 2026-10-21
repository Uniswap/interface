import { Text } from '@universe/mycelium'
// The raw, unescaping component on purpose: this proves containment holds without escaping.
import { Trans } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import { render } from '~/test-utils/render'

// The exact shape from the report: the outer tag puts the inner one in the SVG namespace,
// where <script href> is a real script source.
const HOSTILE_SYMBOL = '<highlight tag=svg><highlight tag=script href="/entry-gateway/x"/></highlight>'

/**
 * Defense in depth below the sinks: even a <Trans> that forgets to escape must not let smuggled
 * attributes mint a script-capable element through mycelium's Text (see compat/safe-tags.ts).
 */
describe('mycelium Text under an unescaped <Trans> interpolation', () => {
  it('cannot be turned into an svg/script element with an href', () => {
    const { container } = render(
      <Trans
        i18nKey="toucan.bidReview.partialFillExplanation"
        values={{ symbol: HOSTILE_SYMBOL, maxFdv: '1 ETH', maxFdvFiat: '$1' }}
        components={{
          highlight: <Text variant="body4" color="$neutral1" />,
          fiat: <Text variant="body4" color="$neutral2" />,
        }}
      />,
    )
    expect(container.querySelector('svg, script')).toBeNull()
    expect(container.textContent).toContain('goes over')
  })

  it('cannot be turned into a javascript: link', () => {
    const { container } = render(
      <Trans
        i18nKey="toucan.bidReview.partialFillExplanation"
        values={{
          symbol: '<highlight tag=a href="javascript:alert(1)">x</highlight>',
          maxFdv: '1 ETH',
          maxFdvFiat: '$1',
        }}
        components={{
          highlight: <Text variant="body4" color="$neutral1" />,
          fiat: <Text variant="body4" color="$neutral2" />,
        }}
      />,
    )
    expect(container.querySelector('a[href]')).toBeNull()
  })
})
