import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarginAmountField } from '~/pages/Swap/Margin/components/shared/MarginAmountField'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/components/AmountInput/AmountInput', () => ({
  AmountInput: (props: Record<string, unknown>) => (
    <input
      aria-label={props['aria-label'] as string | undefined}
      value={(props.value as string | undefined) ?? ''}
      onChange={(e) => (props.onChangeText as ((text: string) => void) | undefined)?.(e.target.value)}
    />
  ),
}))

// Its no-URL fallback renders the symbol as text, which would collide with the chip's own label.
vi.mock('uniswap/src/components/CurrencyLogo/TokenLogo', () => ({
  TokenLogo: () => null,
}))

describe('MarginAmountField', () => {
  const base = { value: '1.5', onChangeText: vi.fn(), maxDecimals: 18, inputAriaLabel: 'Amount' }

  it('renders a static chip with no press handler', () => {
    render(<MarginAmountField {...base} chip={{ kind: 'static', symbol: 'ETH' }} />)
    expect(screen.getByLabelText('Amount')).toHaveValue('1.5')
    expect(screen.getByText('ETH')).toBeInTheDocument()
  })

  it('fires onPress from a select chip', () => {
    const onPress = vi.fn()
    render(
      <MarginAmountField
        {...base}
        chip={{ kind: 'select', symbol: 'USDC', chainId: 1, ariaLabel: 'Choose token', onPress }}
      />,
    )
    fireEvent.click(screen.getByLabelText('Choose token'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('fires onPress from an action trailing affordance', () => {
    const onPress = vi.fn()
    render(
      <MarginAmountField
        {...base}
        chip={{ kind: 'static', symbol: 'ETH' }}
        trailing={{ kind: 'action', label: 'Available 2 ETH', ariaLabel: 'Use max', onPress }}
      />,
    )
    fireEvent.click(screen.getByLabelText('Use max'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('renders a text trailing affordance without a handler', () => {
    render(
      <MarginAmountField
        {...base}
        chip={{ kind: 'static', symbol: 'ETH' }}
        trailing={{ kind: 'text', label: 'Nothing available' }}
      />,
    )
    expect(screen.getByText('Nothing available')).toBeInTheDocument()
  })

  it('renders the label and helper line when given', () => {
    render(
      <MarginAmountField
        {...base}
        chip={{ kind: 'static', symbol: 'ETH' }}
        label="Margin"
        helperCaption="Current 1 ETH"
      />,
    )
    expect(screen.getByText('Margin')).toBeInTheDocument()
    expect(screen.getByText('Current 1 ETH')).toBeInTheDocument()
  })

  // The label sits INSIDE the card with the amount, not above it. Asserted against the helper caption,
  // which has always been a direct child of the card: sharing its parent is only true once the label
  // moves in. Checking the label merely *contains* the input would pass either way, since the old
  // outer wrapper transitively contained the card too.
  it('renders the label inside the card, as a sibling of the helper line', () => {
    render(
      <MarginAmountField
        {...base}
        chip={{ kind: 'static', symbol: 'ETH' }}
        label="Margin"
        helperCaption="Current 1 ETH"
      />,
    )
    expect(screen.getByText('Margin').parentElement).toBe(screen.getByText('Current 1 ETH').parentElement)
  })

  // The optional slots each render conditionally; without this the omission branches are untested and
  // an unconditionally-rendered caption/label passes the whole file.
  it('omits the label, helper line and caption row when not given', () => {
    const bare = render(<MarginAmountField {...base} chip={{ kind: 'static', symbol: 'ETH' }} />)
    expect(screen.queryByText('Margin')).not.toBeInTheDocument()
    expect(screen.queryByText('Current 1 ETH')).not.toBeInTheDocument()
    const bareTextNodes = bare.container.querySelectorAll('span').length
    bare.unmount()

    // Relative, not absolute: the same field WITH every optional slot must render strictly more text
    // nodes. `usdCaption` renders an empty string when absent-but-rowed, so counting is the only way
    // to tell "row omitted" from "row rendered blank".
    const full = render(
      <MarginAmountField
        {...base}
        chip={{ kind: 'static', symbol: 'ETH' }}
        label="Margin"
        usdCaption="$1.00"
        helperCaption="Current 1 ETH"
      />,
    )
    expect(full.container.querySelectorAll('span').length).toBeGreaterThan(bareTextNodes)
  })
})
