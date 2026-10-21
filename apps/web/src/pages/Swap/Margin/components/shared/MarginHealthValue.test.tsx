import { describe, expect, it } from 'vitest'
import { MarginHealthValue } from '~/pages/Swap/Margin/components/shared/MarginHealthValue'
import { render } from '~/test-utils/render'

describe('MarginHealthValue', () => {
  it('renders a single label (no arrow) for the drawer case', () => {
    const { queryByText } = render(<MarginHealthValue before={1.85} />)
    expect(queryByText('Healthy')).not.toBeNull()
    expect(queryByText('→')).toBeNull()
  })
  it('collapses a same-tier before→after to a single label (no arrow)', () => {
    const { queryByText } = render(<MarginHealthValue before={1.3} after={1.26} label="Health factor" />)
    expect(queryByText('Healthy')).not.toBeNull()
    expect(queryByText('→')).toBeNull()
  })
  it('renders a before→after transition with an arrow + combined a11y across tiers', () => {
    const { queryByText, queryByLabelText } = render(
      <MarginHealthValue before={1.85} after={1.15} label="Health factor" />,
    )
    expect(queryByText('Healthy')).not.toBeNull()
    expect(queryByText('Caution')).not.toBeNull()
    expect(queryByText('→')).not.toBeNull()
    expect(queryByLabelText('Health factor: Healthy to Caution')).not.toBeNull()
  })
  it('renders debt-free (Infinity) as Healthy without an arrow', () => {
    const { queryByText } = render(<MarginHealthValue before={Number.POSITIVE_INFINITY} />)
    expect(queryByText('Healthy')).not.toBeNull()
    expect(queryByText('→')).toBeNull()
  })
})
