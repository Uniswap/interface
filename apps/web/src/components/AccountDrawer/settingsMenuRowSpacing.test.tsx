import { render, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import { MemoryRouter } from 'react-router'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { LanguageMenuItems } from '~/components/AccountDrawer/LanguageMenu'
import { LocalCurrencyMenuItems } from '~/components/AccountDrawer/LocalCurrencyMenu'
import { MenuColumn } from '~/components/AccountDrawer/shared'

// Stub the redux/router seams; only the rendered row markup is under test.
vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: () => () => undefined,
}))

vi.mock('uniswap/src/features/language/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/hooks')>()),
  useCurrentLanguage: () => Language.English,
}))

vi.mock('uniswap/src/features/fiatCurrency/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/fiatCurrency/hooks')>()),
  useAppFiatCurrency: () => FiatCurrency.UnitedStatesDollar,
}))

vi.mock('~/hooks/useLocationLinkProps', () => ({
  useLocationLinkProps: () => ({ to: '/' }),
}))

vi.mock('~/hooks/useLocalCurrencyLinkProps', () => ({
  useLocalCurrencyLinkProps: () => ({ to: '/', onClick: () => undefined }),
}))

function rowClasses(testId: string, pattern: RegExp): string[] {
  const rows = screen.getAllByTestId(testId)
  expect(rows.length).toBeGreaterThan(1)

  const row = rows[0]?.closest('a')
  expect(row).not.toBeNull()

  return Array.from(row?.classList ?? []).filter((className) => pattern.test(className))
}

// The containers set no `gap`, so an empty result means the rows butt together.
function verticalPaddingClasses(testId: string): string[] {
  return rowClasses(testId, /^(py|pt|pb)-/)
}

// The row owns no horizontal inset: the sheet/dropdown container supplies it, and a row-level
// value would stack on top of it (INFRA-4019).
function horizontalPaddingClasses(testId: string): string[] {
  return rowClasses(testId, /^(px|pl|pr|mx|ml|mr)-/)
}

describe('Settings list row spacing', () => {
  it('gives each Language row vertical padding', () => {
    render(
      <MemoryRouter>
        <MenuColumn>
          <LanguageMenuItems />
        </MenuColumn>
      </MemoryRouter>,
    )

    expect(verticalPaddingClasses(TestID.WalletLanguageItem)).toEqual(['py-[12px]'])
    expect(horizontalPaddingClasses(TestID.WalletLanguageItem)).toEqual([])
  })

  it('gives each Currency row vertical padding', () => {
    render(
      <MemoryRouter>
        <MenuColumn>
          <LocalCurrencyMenuItems />
        </MenuColumn>
      </MemoryRouter>,
    )

    expect(verticalPaddingClasses(TestID.WalletLocalCurrencyItem)).toEqual(['py-[12px]'])
    expect(horizontalPaddingClasses(TestID.WalletLocalCurrencyItem)).toEqual([])
  })
})
