// @vitest-environment jsdom
import { render } from '@testing-library/react'
import type { CurrencyInputPanelProps } from '@universe/transactions-ui/src/common/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyInputPanel } from '@universe/transactions-ui/src/common/CurrencyInputPanel/CurrencyInputPanel'
import { beforeAll, describe, expect, it, vi } from 'vitest'

beforeAll(() => {
  // useMedia and the short-device check read matchMedia, which jsdom lacks.
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

function countSvgs(props: Partial<CurrencyInputPanelProps>): number {
  const { container, unmount } = render(
    <CurrencyInputPanel
      amount={{ value: '1.5', onChangeValue: vi.fn() }}
      token={{ symbol: 'ETH', logo: { symbol: 'ETH' } }}
      {...props}
    />,
  )
  const count = container.querySelectorAll('svg').length
  unmount()
  return count
}

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('CurrencyInputPanel (web DOM)', () => {
  it('adds the fiat toggle glyph only when asked and there is a fiat value', () => {
    const base = countSvgs({ fiatValue: '$4,861.80' })
    expect(countSvgs({ fiatValue: '$4,861.80', showFiatToggleIcon: true })).toBe(base + 1)
    expect(countSvgs({ fiatValue: '', showFiatToggleIcon: true })).toBe(countSvgs({ fiatValue: '' }))
  })
})
