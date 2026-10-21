import { render } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { Trans } from 'ui/src/i18n/Trans'

// The exact shape from the report: the outer tag puts the inner one in the SVG namespace,
// where <script href> is a real script source.
const HOSTILE_SYMBOL = '<highlight tag=svg><highlight tag=script href="/entry-gateway/x"/></highlight>'

// Kept out of the JSX literal so i18next-parser does not extract it into en-US.json.
const KEY = 'receive'

const i18n = i18next.createInstance()
beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: { [KEY]: 'You receive <highlight>{{symbol}}</highlight> now' } } },
    interpolation: { escapeValue: false },
  })
})

function renderSymbol(symbol: string) {
  return render(<Trans i18n={i18n} i18nKey={KEY} values={{ symbol }} components={{ highlight: <strong /> }} />)
}

describe('Trans', () => {
  it('renders an interpolated value as text, never as markup', () => {
    const { container } = renderSymbol(HOSTILE_SYMBOL)
    expect(container.querySelector('svg, script, [href]')).toBeNull()
    expect(container.textContent).toBe(`You receive ${HOSTILE_SYMBOL} now`)
  })

  it.each(['AT&T', '<$0.01', `O'Neil "quoted" a/b`])('round-trips the honest value %s', (symbol) => {
    const { container } = renderSymbol(symbol)
    expect(container.querySelector('strong')?.textContent).toBe(symbol)
  })

  it('keeps the mapped components', () => {
    const { container } = renderSymbol('ETH')
    expect(container.innerHTML).toBe('You receive <strong>ETH</strong> now')
  })

  it('merges caller tOptions without losing escaping', () => {
    const { container } = render(
      <Trans
        i18n={i18n}
        i18nKey={KEY}
        values={{ symbol: HOSTILE_SYMBOL }}
        tOptions={{ context: 'none' }}
        components={{ highlight: <strong /> }}
      />,
    )
    expect(container.querySelector('svg, script, [href]')).toBeNull()
    expect(container.innerHTML).toBe(
      `You receive <strong>${HOSTILE_SYMBOL.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong> now`,
    )
  })
})
