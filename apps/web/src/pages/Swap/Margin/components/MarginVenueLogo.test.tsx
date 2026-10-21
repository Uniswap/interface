import { describe, expect, it, vi } from 'vitest'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { render } from '~/test-utils/render'

// Stub the two brand ghosts (imported from their direct files, per the icons-barrel lint rule)
// so the venue→logo mapping is assertable without matching SVG paths.
vi.mock('ui/src/components/icons/MorphoLogo', () => ({
  MorphoLogo: () => <svg data-testid="stub-morpho-logo" />,
}))
vi.mock('ui/src/components/icons/AaveLogo', () => ({
  AaveLogo: () => <svg data-testid="stub-aave-logo" />,
}))

describe('MarginVenueLogo', () => {
  it('renders the Morpho mark for a MORPHO market', () => {
    const { queryByTestId } = render(<MarginVenueLogo venue="MORPHO" />)
    expect(queryByTestId('stub-morpho-logo')).not.toBeNull()
    expect(queryByTestId('stub-aave-logo')).toBeNull()
  })

  it('renders the Aave ghost for an AAVE_V4 market', () => {
    const { queryByTestId } = render(<MarginVenueLogo venue="AAVE_V4" />)
    expect(queryByTestId('stub-aave-logo')).not.toBeNull()
    expect(queryByTestId('stub-morpho-logo')).toBeNull()
  })

  it('renders the Aave ghost for an AAVE_V3 market too', () => {
    const { queryByTestId } = render(<MarginVenueLogo venue="AAVE_V3" />)
    expect(queryByTestId('stub-aave-logo')).not.toBeNull()
  })

  // COMPOUND_V3 has no brand mark yet — the row must degrade to label-only, never crash or borrow
  // another venue's ghost.
  it('renders nothing for COMPOUND_V3, which maps to no icon', () => {
    const { container, queryByTestId } = render(<MarginVenueLogo venue="COMPOUND_V3" />)
    expect(queryByTestId('stub-aave-logo')).toBeNull()
    expect(queryByTestId('stub-morpho-logo')).toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })
})
