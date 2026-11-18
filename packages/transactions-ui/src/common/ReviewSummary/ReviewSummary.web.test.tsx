// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ReviewSummary } from '@universe/transactions-ui/src/common/ReviewSummary/ReviewSummary'
import type { ReviewAmount } from '@universe/transactions-ui/src/common/ReviewSummary/ReviewSummary'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const LARGE_AMOUNT = '123,456,789.12'
const LONG_SYMBOL = 'VERYLONGTOKENSYMBOLFORTESTS'
const output: ReviewAmount = { amount: LARGE_AMOUNT, symbol: LONG_SYMBOL, fiat: '$1.00', logo: <span>logo</span> }

beforeAll(() => {
  // useMedia reads matchMedia, which jsdom lacks.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  })
})

// Token-exact: a substring match would also accept e.g. `sm:whitespace-nowrap`.
function classTokens(element: Element | null | undefined): string[] {
  return element?.className.split(/\s+/) ?? []
}

const SINGLE_LINE_ELLIPSIS = ['whitespace-nowrap', 'text-ellipsis', 'overflow-hidden']

// Web class assertions: the native leg renders through react-native-web and has no Tailwind classes.
describe('ReviewSummary (web classes)', () => {
  it('ellipsizes a long symbol on one line, and lets the column shrink so it stops before the logo', () => {
    render(<ReviewSummary input={null} output={output} title="t" />)
    const symbol = screen.getByText(LONG_SYMBOL)
    expect(classTokens(symbol)).toEqual(expect.arrayContaining([...SINGLE_LINE_ELLIPSIS, 'shrink-[1]']))
    // Without a shrinkable column the single line overflows past the logo instead of ellipsizing.
    expect(classTokens(symbol.parentElement?.parentElement)).toEqual(expect.arrayContaining(['shrink', 'min-w-[0px]']))
  })

  it('never shrinks or truncates a large amount next to a long symbol', () => {
    render(<ReviewSummary input={null} output={output} title="t" />)
    const amount = screen.getByText(LARGE_AMOUNT)
    expect(amount.nextElementSibling?.textContent).toBe(LONG_SYMBOL)
    expect(classTokens(amount)).toContain('shrink-[0]')
    for (const token of SINGLE_LINE_ELLIPSIS) {
      expect(classTokens(amount)).not.toContain(token)
    }
  })

  it('ellipsizes a long symbol next to the loading amount', () => {
    render(<ReviewSummary input={null} output={{ ...output, isAmountLoading: true }} title="t" />)
    expect(classTokens(screen.getByText(LONG_SYMBOL))).toEqual(
      expect.arrayContaining([...SINGLE_LINE_ELLIPSIS, 'shrink-[1]']),
    )
  })
})
