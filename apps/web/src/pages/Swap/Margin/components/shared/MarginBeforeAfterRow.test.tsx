import { describe, expect, it } from 'vitest'
import { MarginBeforeAfterRow } from '~/pages/Swap/Margin/components/shared/MarginBeforeAfterRow'
import { render } from '~/test-utils/render'

describe('MarginBeforeAfterRow', () => {
  it('collapses to one value when before and after render identically', () => {
    const { queryByText, queryAllByText, queryByLabelText } = render(
      <MarginBeforeAfterRow label="Leverage" before="5.03x" after="5.03x" />,
    )
    expect(queryByText('→')).toBeNull()
    expect(queryAllByText('5.03x')).toHaveLength(1)
    // The combined a11y string would read "5.03x to 5.03x" — nonsense for a value that did not move.
    expect(queryByLabelText('Leverage: 5.03x to 5.03x')).toBeNull()
  })

  it('renders before → after with a combined a11y label when the values differ', () => {
    const { queryByText, queryByLabelText } = render(
      <MarginBeforeAfterRow label="Leverage" before="2.00x" after="3.50x" />,
    )
    expect(queryByText('2.00x')).not.toBeNull()
    expect(queryByText('3.50x')).not.toBeNull()
    expect(queryByText('→')).not.toBeNull()
    expect(queryByLabelText('Leverage: 2.00x to 3.50x')).not.toBeNull()
  })

  // The suffix rides only on the after side, so comparing the composed string would never match.
  it('keeps the suffix on a collapsed row', () => {
    const { queryByText } = render(
      <MarginBeforeAfterRow label="Liquidates at" before="$1,773.14" after="$1,773.14" suffix="(+6.8%)" />,
    )
    expect(queryByText('→')).toBeNull()
    expect(queryByText('$1,773.14 (+6.8%)')).not.toBeNull()
  })

  it('appends the suffix to the after value in a transition', () => {
    const { queryByText } = render(
      <MarginBeforeAfterRow label="Liquidates at" before="$1,162.79" after="$1,773.14" suffix="(+6.8%)" />,
    )
    expect(queryByText('$1,162.79')).not.toBeNull()
    expect(queryByText('$1,773.14 (+6.8%)')).not.toBeNull()
  })

  // One render per test: RTL binds its queries to document.body, so two renders in one case would
  // count each other's logos.
  it('renders one logo when collapsed', () => {
    const { queryAllByTestId } = render(
      <MarginBeforeAfterRow label="Size" before="2 ETH" after="2 ETH" logos={{ symbol: 'ETH' }} />,
    )
    expect(queryAllByTestId('token-logo')).toHaveLength(1)
  })

  it('renders a logo on each side in a transition', () => {
    const { queryAllByTestId } = render(
      <MarginBeforeAfterRow label="Size" before="2 ETH" after="3 ETH" logos={{ symbol: 'ETH' }} />,
    )
    expect(queryAllByTestId('token-logo')).toHaveLength(2)
  })
})
