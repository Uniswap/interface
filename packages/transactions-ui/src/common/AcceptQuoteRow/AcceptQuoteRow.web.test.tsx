// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { AcceptQuoteRow } from '@universe/transactions-ui/src/common/AcceptQuoteRow/AcceptQuoteRow'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (class names): the native leg renders through react-native-web and does
// not produce them.
describe('AcceptQuoteRow (web DOM)', () => {
  it('sizes the Accept button to its label instead of stretching or shrinking', () => {
    render(<AcceptQuoteRow value="1,234.56 USDC" onAccept={vi.fn()} />)
    const className = screen.getByText('common.button.accept').closest('[role="button"], button')?.className ?? ''
    expect(className).toContain('shrink-0')
    expect(className).not.toContain('basis-0')
  })
})
