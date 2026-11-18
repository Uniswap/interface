// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { SlippageSettingValue } from '@universe/transactions-ui/src/common/SlippageSettingValue/SlippageSettingValue'
import { describe, expect, it } from 'vitest'

describe('SlippageSettingValue', () => {
  it('shows the Auto pill next to an auto tolerance', () => {
    render(<SlippageSettingValue slippage={{ tolerance: '0.5%', isCustom: false, isZero: false }} />)
    expect(screen.getByText('swap.settings.slippage.control.auto')).toBeTruthy()
    expect(screen.getByText('0.5%')).toBeTruthy()
  })

  it('drops the pill for a custom tolerance and for no slippage', () => {
    const { rerender } = render(
      <SlippageSettingValue slippage={{ tolerance: '1.25%', isCustom: true, isZero: false }} />,
    )
    expect(screen.queryByText('swap.settings.slippage.control.auto')).toBeNull()
    rerender(<SlippageSettingValue slippage={{ tolerance: '0%', isCustom: false, isZero: true }} />)
    expect(screen.queryByText('swap.settings.slippage.control.auto')).toBeNull()
    expect(screen.getByText('0%')).toBeTruthy()
  })
})
