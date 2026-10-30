import { render } from '@testing-library/react'
import { createInstance, type i18n as I18n } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { DisclosuresBody } from 'uniswap/src/components/disclosures/DisclosuresBody'
import enUS from 'uniswap/src/i18n/locales/source/en-US.json'

// The package setup stubs react-i18next (Trans renders nothing); this suite needs the real one.
vi.mock('react-i18next', async (importOriginal) => importOriginal())

const DISCLOSURE_KEYS = Object.keys(enUS).filter((key) => key.startsWith('disclosures.'))

async function createI18n(language: string, translation: Record<string, string>): Promise<I18n> {
  const instance = createInstance()
  await instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en-US',
    resources: { [language]: { translation }, 'en-US': { translation: enUS } },
    interpolation: { escapeValue: false },
    react: { transSupportBasicHtmlNodes: false },
  })
  return instance
}

async function renderDisclosures(language: 'en-US' | 'fr-FR', translation: Record<string, string> = {}) {
  const i18n = await createI18n(language, translation)
  return render(
    <I18nextProvider i18n={i18n}>
      <DisclosuresBody />
    </I18nextProvider>,
  )
}

function stripTags(value: string): string {
  return value.replace(/<\/?[a-zA-Z]+>/g, '')
}

function paragraphTexts(container: HTMLElement): string[] {
  const root = container.firstElementChild
  return Array.from(root?.children ?? []).map((paragraph) => paragraph.textContent)
}

describe('DisclosuresBody', () => {
  it('renders every disclosures key as its own paragraph, with the source copy unaltered', async () => {
    const { container } = await renderDisclosures('en-US')

    expect(DISCLOSURE_KEYS).toHaveLength(15)
    const expected = DISCLOSURE_KEYS.map((key) => stripTags(enUS[key as keyof typeof enUS]))
    // Exact equality: Trans must not collapse the copy's double spaces or touch its typographic quotes.
    expect(paragraphTexts(container).sort()).toEqual([...expected].sort())
  })

  it('renders the inline links with their labels and destinations', async () => {
    const { getByText } = await renderDisclosures('en-US')

    // Literals on purpose: these pin the shipped labels and URLs independently of the catalog.
    expect(getByText('app.uniswap.org').closest('a')?.getAttribute('href')).toBe('https://app.uniswap.org')
    expect(getByText('Unsupported Token Policy').closest('a')?.getAttribute('href')).toBe(
      'https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy',
    )
    expect(getByText('here').closest('a')?.getAttribute('href')).toBe(
      'https://github.com/Uniswap/uniroute-public/tree/main',
    )
    expect(getByText('How to change slippage on the Uniswap Web app').closest('a')?.getAttribute('href')).toBe(
      'https://support.uniswap.org/hc/en-us/articles/8643879653261-How-to-change-slippage-on-the-Uniswap-Web-app',
    )
    expect(getByText('How to change swap deadlines on the Uniswap interface').closest('a')?.getAttribute('href')).toBe(
      'https://support.uniswap.org/hc/en-us/articles/45320061462797-How-to-change-swap-deadlines-on-the-Uniswap-interface',
    )
  })

  it('renders the active language, letting the translation reorder the links', async () => {
    const { container, getByText, queryByText } = await renderDisclosures('fr-FR', {
      'disclosures.products':
        'Voir la <unsupportedTokenPolicyLink>Politique des jetons</unsupportedTokenPolicyLink> sur <appLink>le site</appLink>.',
      'disclosures.gasFees': 'Les frais de gaz sont payés aux validateurs.',
    })

    const paragraphs = paragraphTexts(container)
    expect(paragraphs[0]).toBe('Voir la Politique des jetons sur le site.')
    expect(paragraphs).toContain('Les frais de gaz sont payés aux validateurs.')
    expect(getByText('Politique des jetons').closest('a')?.getAttribute('href')).toBe(
      'https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy',
    )
    expect(getByText('le site').closest('a')?.getAttribute('href')).toBe('https://app.uniswap.org')
    expect(queryByText(/^Gas Fees are paid/)).toBeNull()
  })

  it('falls back to English for a key the active language has not translated yet', async () => {
    const { container } = await renderDisclosures('fr-FR', {})

    expect(paragraphTexts(container)).toContain(
      'Gas Limit is the maximum unit of gas that the user’s transaction is allowed to consume.',
    )
  })
})
