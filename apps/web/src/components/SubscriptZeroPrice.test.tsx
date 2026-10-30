import { Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/language/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/hooks')>()),
  useCurrentLocale: vi.fn(),
}))

function renderedText(element: JSX.Element): string {
  const { container } = render(element)
  return container.textContent
}

describe('SubscriptZeroPrice', () => {
  it('renders the subscript prefix with a dot decimal for en-US', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.EnglishUnitedStates)
    expect(renderedText(<SubscriptZeroPrice value={0.000034} disableTooltip />)).toBe('0.0434')
  })

  it('renders the subscript prefix with the locale decimal separator for comma-decimal locales', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.DutchNetherlands)
    expect(renderedText(<SubscriptZeroPrice value={0.000034} symbol="ETH" disableTooltip />)).toBe('0,0434 ETH')

    mocked(useCurrentLocale).mockReturnValue(Locale.SpanishSpain)
    expect(renderedText(<SubscriptZeroPrice value={0.000034} disableTooltip />)).toBe('0,0434')
  })

  it('formats non-subscript values in the current locale', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.DutchNetherlands)
    expect(renderedText(<SubscriptZeroPrice value={0.0012} />)).toBe('0,0012')
  })

  it('switches to subscript at the given threshold', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.EnglishUnitedStates)
    // 0.000034 has 4 leading zeros: below a threshold of 6 it stays a plain decimal
    expect(renderedText(<SubscriptZeroPrice value={0.000034} subscriptThreshold={6} />)).toBe('0.000034')
    expect(renderedText(<SubscriptZeroPrice value={0.000034} subscriptThreshold={4} disableTooltip />)).toBe('0.0434')
  })

  it('renders zero without subscript', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.DutchNetherlands)
    expect(renderedText(<SubscriptZeroPrice value={0} />)).toBe('0')
  })
})
