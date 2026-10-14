import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Text } from '@universe/mycelium'
import { CategoryDescriptionText } from 'uniswap/src/features/tokenCategories/CategoryDescriptionText'
import { hasRwaDisclaimer } from 'uniswap/src/features/tokenCategories/RwaDisclaimerText'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { render } from 'uniswap/src/test/test-utils'

// The package's react-i18next mock renders Trans as nothing, so stand in for the disclaimer copy.
vi.mock('uniswap/src/features/tokenCategories/RwaDisclaimerText', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokenCategories/RwaDisclaimerText')>()),
  RwaDisclaimerText: ({ link }: { link: JSX.Element }): JSX.Element => <>DISCLAIMER {link}</>,
}))

function renderLink(label: string): JSX.Element {
  return <Text>{`LINK:${label}`}</Text>
}

describe('CategoryDescriptionText', () => {
  it('ends a plain category description with the link', () => {
    const gaming = tokenCategory({ id: 'gaming', description: 'Gaming tokens.' })
    const { getByText, queryByText } = render(
      <Text>
        <CategoryDescriptionText category={gaming} renderLink={renderLink} />
      </Text>,
    )
    // The default normalizer collapses \u00A0 into a plain space, which would hide a regression.
    expect(getByText('LINK:Learn\u00A0more', { normalizer: (text) => text })).toBeTruthy()
    expect(getByText(/Gaming tokens\./)).toBeTruthy()
    expect(queryByText(/DISCLAIMER/)).toBeNull()
  })

  it('puts the disclaimer between the description and the link for stocks', () => {
    const stocks = tokenCategory({ id: 'stocks', description: 'Tokenized stocks.' })
    const { getAllByText, getByText } = render(
      <Text>
        <CategoryDescriptionText category={stocks} renderLink={renderLink} />
      </Text>,
    )
    expect(getByText(/DISCLAIMER/)).toBeTruthy()
    expect(getAllByText(/^LINK:/)).toHaveLength(1)
  })
})

describe('hasRwaDisclaimer', () => {
  it('is true for stocks and etfs only', () => {
    expect(hasRwaDisclaimer(RwaCategory.STOCKS)).toBe(true)
    expect(hasRwaDisclaimer(RwaCategory.ETFS)).toBe(true)
    expect(hasRwaDisclaimer(RwaCategory.COMMODITIES)).toBe(false)
    expect(hasRwaDisclaimer(RwaCategory.UNSPECIFIED)).toBe(false)
  })
})
