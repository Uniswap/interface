import { HookUnavailableValue } from '~/features/Hooks/components/HookUnavailableValue'
import { render, screen } from '~/test-utils/render'

describe('HookUnavailableValue', () => {
  it('keeps the dash visual while announcing unavailable data', () => {
    render(<HookUnavailableValue />)

    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Unavailable')).toHaveClass('sr-only')
  })

  it('accepts a metric typography variant without adding another heading', () => {
    render(<HookUnavailableValue variant="heading3" fontSize={16} lineHeight={20} />)

    expect(screen.getByText('—').tagName).toBe('SPAN')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })
})
