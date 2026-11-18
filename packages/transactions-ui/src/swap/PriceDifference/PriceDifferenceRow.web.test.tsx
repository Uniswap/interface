// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import {
  PriceDifferenceLabel,
  PriceDifferenceRow,
} from '@universe/transactions-ui/src/swap/PriceDifference/PriceDifferenceRow'
import { describe, expect, it } from 'vitest'

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('PriceDifferenceRow (web DOM)', () => {
  it('colors the value by level and falls back to the info color without one', () => {
    const { unmount } = render(<PriceDifferenceRow value="12.50%" level="critical" label={null} />)
    expect(screen.getByText('12.50%').className).toContain('--stext-statusCritical')
    unmount()
    render(<PriceDifferenceRow value="0.10%" label={null} />)
    expect(screen.getByText('0.10%').className).toContain('--stext-neutral2')
  })
})
