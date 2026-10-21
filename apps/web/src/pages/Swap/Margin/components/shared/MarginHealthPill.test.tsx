import { describe, expect, it } from 'vitest'
import { MarginHealthPill } from '~/pages/Swap/Margin/components/shared/MarginHealthPill'
import { render } from '~/test-utils/render'

describe('MarginHealthPill', () => {
  it('renders the Healthy label for a healthy factor', () => {
    const { queryByText } = render(<MarginHealthPill healthFactor={1.85} />)
    expect(queryByText('Healthy')).not.toBeNull()
  })
  it('renders the Caution label in the caution band', () => {
    const { queryByText } = render(<MarginHealthPill healthFactor={1.15} />)
    expect(queryByText('Caution')).not.toBeNull()
  })
  it('renders the At risk label below the caution floor', () => {
    const { queryByText } = render(<MarginHealthPill healthFactor={1.0} />)
    expect(queryByText('At risk')).not.toBeNull()
  })
})
