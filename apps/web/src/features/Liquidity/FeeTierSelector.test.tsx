import { Percent } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { FeeTierSelector } from '~/features/Liquidity/FeeTierSelector'
import { render } from '~/test-utils/render'

const staticFeeTiers = [
  {
    value: { feeAmount: FeeAmount.LOWEST, tickSpacing: TICK_SPACINGS[FeeAmount.LOWEST], isDynamic: false },
    title: 'Best for very stable pairs',
    selectionPercent: new Percent(10, 100),
    tvl: '1000',
  },
  {
    value: { feeAmount: FeeAmount.LOW, tickSpacing: TICK_SPACINGS[FeeAmount.LOW], isDynamic: false },
    title: 'Best for stable pairs',
    selectionPercent: new Percent(20, 100),
    tvl: '2000',
  },
  {
    value: { feeAmount: FeeAmount.MEDIUM, tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM], isDynamic: false },
    title: 'Best for most pairs',
    selectionPercent: new Percent(50, 100),
    tvl: '5000',
  },
  {
    value: { feeAmount: FeeAmount.HIGH, tickSpacing: TICK_SPACINGS[FeeAmount.HIGH], isDynamic: false },
    title: 'Best for exotic pairs',
    selectionPercent: new Percent(20, 100),
    tvl: '3000',
  },
]

const dynamicFeeTier = {
  value: DYNAMIC_FEE_DATA,
  title: 'Best for customizability',
  selectionPercent: new Percent(5, 100),
  tvl: '500',
}

const noopSelect = vi.fn()

describe('FeeTierSelector', () => {
  describe('dynamic fee filtering', () => {
    it('should exclude dynamic fee tiers by default', () => {
      const feeTiersWithDynamic = [...staticFeeTiers, dynamicFeeTier]
      const { queryByText } = render(
        <FeeTierSelector
          selectedFee={undefined}
          onFeeSelect={noopSelect}
          feeTiers={feeTiersWithDynamic}
          isExpanded={true}
        />,
      )

      expect(queryByText('Best for exotic pairs')).toBeInTheDocument()
      expect(queryByText('Best for customizability')).not.toBeInTheDocument()
    })

    it('should include dynamic fee tiers when allowDynamicFee is true', () => {
      const feeTiersWithDynamic = [...staticFeeTiers, dynamicFeeTier]
      const { queryByText } = render(
        <FeeTierSelector
          selectedFee={undefined}
          onFeeSelect={noopSelect}
          feeTiers={feeTiersWithDynamic}
          allowDynamicFee={true}
          isExpanded={true}
        />,
      )

      expect(queryByText('Best for exotic pairs')).toBeInTheDocument()
      expect(queryByText('Best for customizability')).toBeInTheDocument()
    })

    it('should render all static fee tiers regardless of allowDynamicFee', () => {
      const { queryByText } = render(
        <FeeTierSelector
          selectedFee={undefined}
          onFeeSelect={noopSelect}
          feeTiers={staticFeeTiers}
          isExpanded={true}
        />,
      )

      expect(queryByText('Best for very stable pairs')).toBeInTheDocument()
      expect(queryByText('Best for stable pairs')).toBeInTheDocument()
      expect(queryByText('Best for most pairs')).toBeInTheDocument()
      expect(queryByText('Best for exotic pairs')).toBeInTheDocument()
    })
  })

  describe('read-only mode', () => {
    it('should show the selected fee with no expand button (e.g. fixed 0.3% for v2)', () => {
      const { queryByText, queryByRole } = render(
        <FeeTierSelector
          selectedFee={staticFeeTiers[2].value}
          onFeeSelect={noopSelect}
          feeTiers={[]}
          readOnly={true}
        />,
      )

      expect(queryByText(/0.30?%/)).toBeInTheDocument()
      expect(queryByRole('button')).not.toBeInTheDocument()
    })

    it('should not render fee tier options even when fee tiers are provided', () => {
      const { queryByText } = render(
        <FeeTierSelector
          selectedFee={staticFeeTiers[2].value}
          onFeeSelect={noopSelect}
          feeTiers={staticFeeTiers}
          readOnly={true}
          isExpanded={true}
        />,
      )

      expect(queryByText('Best for most pairs')).not.toBeInTheDocument()
    })
  })

  describe('TVL display', () => {
    it('should not show TVL labels when all fee tiers have zero TVL', () => {
      const zeroTvlTiers = staticFeeTiers.map((tier) => ({ ...tier, tvl: '0', selectionPercent: undefined }))
      const { queryAllByText } = render(
        <FeeTierSelector selectedFee={undefined} onFeeSelect={noopSelect} feeTiers={zeroTvlTiers} isExpanded={true} />,
      )

      expect(queryAllByText(/TVL/).length).toBe(0)
    })

    it('should show TVL labels when at least one fee tier has non-zero TVL', () => {
      const { queryAllByText } = render(
        <FeeTierSelector
          selectedFee={undefined}
          onFeeSelect={noopSelect}
          feeTiers={staticFeeTiers}
          isExpanded={true}
        />,
      )

      expect(queryAllByText(/TVL/).length).toBeGreaterThan(0)
    })
  })
})
