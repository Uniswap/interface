// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import type { TokenSelectButtonToken } from '@universe/transactions-ui/src/common/TokenSelectButton/TokenSelectButton'
import { TokenSelectButton } from '@universe/transactions-ui/src/common/TokenSelectButton/TokenSelectButton'
import { describe, expect, it, vi } from 'vitest'

const uni: TokenSelectButtonToken = { symbol: 'UNI', logo: { symbol: 'UNI', url: 'https://example.com/uni.png' } }

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('TokenSelectButton (web DOM)', () => {
  it('renders the chevron only when asked', () => {
    const { container, rerender } = render(<TokenSelectButton token={uni} onPress={vi.fn()} />)
    const svgsWithout = container.querySelectorAll('svg').length
    rerender(<TokenSelectButton showChevron token={uni} onPress={vi.fn()} />)
    expect(container.querySelectorAll('svg').length).toBe(svgsWithout + 1)
  })
})
