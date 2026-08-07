import i18n from 'uniswap/src/i18n'
import { CustomPriceRangeEditor } from '~/pages/Liquidity/CreateAuction/components/CustomPriceRangeEditor'
import {
  type CustomPriceRangeEntry,
  CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
  MAX_CUSTOM_PRICE_RANGE_ENTRIES,
} from '~/pages/Liquidity/CreateAuction/types'
import { render, screen } from '~/test-utils/render'

// Resolved through i18n so the plural form tracks the cap instead of hardcoding the `_other` copy.
const AT_LIMIT_MESSAGE = i18n.t('toucan.createAuction.step.customizePool.priceRange.custom.maxRangesReached', {
  count: MAX_CUSTOM_PRICE_RANGE_ENTRIES,
})

function buildEntries(count: number): CustomPriceRangeEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `custom-range-${index + 1}`,
    liquidityPercent: 100 / count,
    minPercentFromClearing: index === 0 ? -100 : -50,
    maxPercentFromClearing: index === 0 ? CUSTOM_PRICE_RANGE_POSITIVE_INFINITY : 100,
  }))
}

function renderEditor(entryCount: number) {
  return render(
    <CustomPriceRangeEditor
      entries={buildEntries(entryCount)}
      histogramBarColor="#FC72FF"
      onAddPreset={() => {}}
      onUpdateLiquidityPercent={() => {}}
      onUpdateBounds={() => {}}
      onRemoveEntry={() => {}}
    />,
  )
}

describe('CustomPriceRangeEditor at-limit message', () => {
  it('stays hidden while more ranges can be added', () => {
    renderEditor(MAX_CUSTOM_PRICE_RANGE_ENTRIES - 1)

    expect(screen.queryByText(AT_LIMIT_MESSAGE)).toBeNull()
  })

  it('shows the maximum-ranges message once the limit is reached', () => {
    renderEditor(MAX_CUSTOM_PRICE_RANGE_ENTRIES)

    expect(screen.getByText(AT_LIMIT_MESSAGE)).toBeInTheDocument()
  })
})
