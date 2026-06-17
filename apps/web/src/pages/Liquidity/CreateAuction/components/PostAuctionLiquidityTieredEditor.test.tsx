import { useState } from 'react'
import { PostAuctionLiquidityTieredEditor } from '~/pages/Liquidity/CreateAuction/components/PostAuctionLiquidityTieredEditor'
import type { PostAuctionLiquidityTier } from '~/pages/Liquidity/CreateAuction/types'
import { clampPostAuctionLiquidityTierPercent } from '~/pages/Liquidity/CreateAuction/utils'
import { act, fireEvent, render, screen } from '~/test-utils/render'

/**
 * Harness that mirrors the real store: every percent update is clamped to [MIN, MAX] and fed
 * back into `tiers`. The bug under test only reproduces with that round-trip, because the
 * clamped value flows back into the input via props.
 *
 * A single unbounded tier (empty `raiseMilestone`) renders exactly one percent input and no
 * milestone input, so `screen.getByRole('textbox')` is unambiguous.
 */
function ControlledTieredEditor({ initialPercent = 30 }: { initialPercent?: number }) {
  const [tiers, setTiers] = useState<PostAuctionLiquidityTier[]>([
    { id: 'tier-1', raiseMilestone: '', percent: initialPercent },
  ])

  return (
    <PostAuctionLiquidityTieredEditor
      raiseCurrencySymbol="ETH"
      tiers={tiers}
      inputCurrency="raise"
      usdPriceNum={null}
      fiatCurrencyCode="USD"
      onAddTier={() => {}}
      onRemoveTier={() => {}}
      onUpdateTier={(tierId, config) => {
        setTiers((prev) =>
          prev.map((tier) =>
            tier.id !== tierId
              ? tier
              : {
                  ...tier,
                  raiseMilestone: config.raiseMilestone ?? tier.raiseMilestone,
                  percent:
                    config.percent !== undefined ? clampPostAuctionLiquidityTierPercent(config.percent) : tier.percent,
                },
          ),
        )
      }}
    />
  )
}

function getPercentInput(): HTMLInputElement {
  return screen.getByRole('textbox') as HTMLInputElement
}

describe('PostAuctionLiquidityTieredEditor percent input', () => {
  it('does not clamp to the minimum while typing (clamp only on blur)', () => {
    render(<ControlledTieredEditor initialPercent={30} />)
    const input = getPercentInput()

    act(() => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '5' } })
    })

    // Regression: the first digit of "50" (5 < MIN 25) used to snap to "25" mid-typing,
    // making "50" impossible to type.
    expect(input.value).toBe('5')

    act(() => {
      fireEvent.change(input, { target: { value: '50' } })
    })
    expect(input.value).toBe('50')
  })

  it('clamps below-minimum values up to the minimum on blur', () => {
    render(<ControlledTieredEditor initialPercent={30} />)
    const input = getPercentInput()

    act(() => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '5' } })
      fireEvent.blur(input)
    })

    expect(input.value).toBe('25')
  })

  it('clamps above-maximum values down to the maximum on blur', () => {
    render(<ControlledTieredEditor initialPercent={30} />)
    const input = getPercentInput()

    act(() => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: '150' } })
    })
    // Not clamped while typing.
    expect(input.value).toBe('150')

    act(() => {
      fireEvent.blur(input)
    })
    expect(input.value).toBe('100')
  })
})
