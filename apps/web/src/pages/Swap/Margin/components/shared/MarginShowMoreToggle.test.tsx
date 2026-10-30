import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'
import { render } from '~/test-utils/render'

describe('MarginShowMoreToggle', () => {
  it('shows the label by default', () => {
    render(<MarginShowMoreToggle isExpanded={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Show more')).toBeInTheDocument()
  })

  // Arrow-only variant: the visible text goes, the accessible name must not.
  it('hides the visible label but keeps the accessible name with hideLabel', () => {
    const onToggle = vi.fn()
    render(<MarginShowMoreToggle isExpanded hideLabel onToggle={onToggle} />)
    expect(screen.queryByText('Show less')).not.toBeInTheDocument()
    const toggle = screen.getByLabelText('Show less')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
