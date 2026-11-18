// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ReviewSummary } from '@universe/transactions-ui/src/common/ReviewSummary/ReviewSummary'
import type { ReviewAmount } from '@universe/transactions-ui/src/common/ReviewSummary/ReviewSummary'
import { describe, expect, it } from 'vitest'

const LARGE_AMOUNT = '123,456,789.12'
const LONG_SYMBOL = 'VERYLONGTOKENSYMBOLFORTESTS'
const output: ReviewAmount = { amount: LARGE_AMOUNT, symbol: LONG_SYMBOL, fiat: '$1.00', logo: <span>logo</span> }

// Native layout: react-native-web turns numberOfLines={1} into single-line ellipsis styles.
describe('ReviewSummary (native layout)', () => {
  it('ellipsizes a long symbol on one line and never shrinks the amount', () => {
    render(<ReviewSummary input={null} output={output} title="t" />)
    const symbol = getComputedStyle(screen.getByText(LONG_SYMBOL))
    expect(symbol.flexShrink).toBe('1')
    expect(symbol.whiteSpace).toBe('nowrap')
    expect(symbol.textOverflow).toBe('ellipsis')
    const amount = getComputedStyle(screen.getByText(LARGE_AMOUNT))
    expect(amount.flexShrink).toBe('0')
    expect(amount.whiteSpace).not.toBe('nowrap')
  })

  it('ellipsizes a long symbol next to the loading amount', () => {
    render(<ReviewSummary input={null} output={{ ...output, isAmountLoading: true }} title="t" />)
    const symbol = getComputedStyle(screen.getByText(LONG_SYMBOL))
    expect(symbol.flexShrink).toBe('1')
    expect(symbol.textOverflow).toBe('ellipsis')
  })
})
