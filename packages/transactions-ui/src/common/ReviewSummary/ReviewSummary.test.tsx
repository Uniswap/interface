// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { ReviewSummary } from '@universe/transactions-ui/src/common/ReviewSummary/ReviewSummary'
import type { ReviewAmount } from '@universe/transactions-ui/src/common/ReviewSummary/ReviewSummary'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const input: ReviewAmount = { amount: '1.5', symbol: 'ETH', fiat: '$4,861.80', logo: <span>eth-logo</span> }
const output: ReviewAmount = { amount: '4,859.21', symbol: 'USDC', fiat: '$4,858.95', logo: <span>usdc-logo</span> }
const LONG_SYMBOL = 'VERYLONGTOKENSYMBOLFORTESTS'

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

describe('ReviewSummary', () => {
  it('renders the title, both amounts, fiat values and logo slots', () => {
    render(<ReviewSummary input={input} output={output} title="You're swapping" />)
    expect(screen.getByText("You're swapping")).toBeTruthy()
    expect(screen.getByText('1.5')).toBeTruthy()
    expect(screen.getByText('ETH')).toBeTruthy()
    expect(screen.getByText('4,859.21')).toBeTruthy()
    expect(screen.getByText('USDC')).toBeTruthy()
    expect(screen.getByText('$4,861.80')).toBeTruthy()
    expect(screen.getByText('usdc-logo')).toBeTruthy()
  })

  it('keeps the symbol but hides amount and fiat while the amount refreshes', () => {
    render(<ReviewSummary input={input} output={{ ...output, isAmountLoading: true }} title="t" />)
    expect(screen.getByText('USDC')).toBeTruthy()
    expect(screen.queryByText(/4,859\.21/)).toBeNull()
    expect(screen.queryByText('$4,858.95')).toBeNull()
  })

  it('renders a skeleton row for a side whose currency info is missing', () => {
    render(<ReviewSummary input={null} output={output} title="t" />)
    expect(screen.queryByText(/ETH/)).toBeNull()
    expect(screen.getByText('4,859.21')).toBeTruthy()
  })

  it('renders the network badge on cross-chain sides', () => {
    render(
      <ReviewSummary
        input={input}
        output={{ ...output, network: { label: 'Base', color: '$accent1', logo: <span>base-logo</span> } }}
        title="t"
      />,
    )
    expect(screen.getByText('Base')).toBeTruthy()
    expect(screen.getByText('base-logo')).toBeTruthy()
  })

  it('shows the close button only when onClose is set', () => {
    const onClose = vi.fn()
    const { container, rerender } = render(<ReviewSummary input={input} output={output} title="t" />)
    const buttonsWithout = container.querySelectorAll('[role="button"], button').length
    rerender(<ReviewSummary input={input} output={output} title="t" onClose={onClose} />)
    const buttons = container.querySelectorAll('[role="button"], button')
    expect(buttons.length).toBe(buttonsWithout + 1)
    fireEvent.click(buttons[buttons.length - 1] as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  describe('symbol', () => {
    it('renders a 7-character symbol in full, apart from the amount', () => {
      render(<ReviewSummary input={input} output={{ ...output, symbol: 'pathUSD' }} title="t" />)
      expect(screen.getByText('pathUSD')).toBeTruthy()
      expect(screen.getByText('4,859.21')).toBeTruthy()
      expect(screen.queryByText(/…/)).toBeNull()
    })

    it('renders a very long symbol whole, leaving truncation to layout', () => {
      render(<ReviewSummary input={input} output={{ ...output, symbol: LONG_SYMBOL }} title="t" />)
      expect(screen.getByText(LONG_SYMBOL)).toBeTruthy()
    })

    it('keeps the symbol on its own while the amount refreshes', () => {
      render(
        <ReviewSummary input={input} output={{ ...output, symbol: LONG_SYMBOL, isAmountLoading: true }} title="t" />,
      )
      expect(screen.getByText(LONG_SYMBOL)).toBeTruthy()
    })

    it('renders the amount alone when there is no symbol', () => {
      render(<ReviewSummary input={input} output={{ ...output, symbol: '' }} title="t" />)
      expect(screen.getByText('4,859.21').nextElementSibling).toBeNull()
    })
  })
})
