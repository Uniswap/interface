import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { render } from '~/test-utils/render'

describe('MarginDetailRow', () => {
  it('renders label and string value', () => {
    render(<MarginDetailRow label="Entry price" value="$3,000" />)
    expect(screen.getByText('Entry price')).toBeInTheDocument()
    expect(screen.getByText('$3,000')).toBeInTheDocument()
  })

  it('applies textVariant to both label and string value', () => {
    const { unmount } = render(<MarginDetailRow label="Entry price" value="$3,000" />)
    const defaultLabelClass = screen.getByText('Entry price').className
    const defaultValueClass = screen.getByText('$3,000').className
    unmount()

    render(<MarginDetailRow label="Entry price" value="$3,000" textVariant="body4" />)
    expect(screen.getByText('Entry price').className).not.toBe(defaultLabelClass)
    expect(screen.getByText('$3,000').className).not.toBe(defaultValueClass)
  })
})
