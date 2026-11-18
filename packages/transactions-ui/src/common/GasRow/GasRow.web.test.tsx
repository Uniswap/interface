// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { GasRow, GasSummary } from '@universe/transactions-ui/src/common/GasRow/GasRow'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('GasRow (web DOM)', () => {
  it('exposes the expanded state and toggles from the keyboard', () => {
    const onExpandedChange = vi.fn()
    render(<GasRow expanded gasSummary={<GasSummary gasText="$1.24" />} onExpandedChange={onExpandedChange} />)
    const toggle = screen.getByRole('button')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(toggle, { key: 'Enter' })
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
    fireEvent.keyDown(toggle, { key: ' ' })
    expect(onExpandedChange).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(toggle, { key: 'Tab' })
    expect(onExpandedChange).toHaveBeenCalledTimes(2)
  })
})
