import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Gas } from 'ui/src/components/icons/Gas'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'
import { bpsToPercent } from '~/pages/Swap/Margin/marginFormat'

// Adjust-position modal's collapsible detail section: caller-supplied rows (the borrowing before→after),
// max slippage always, and network cost when the quote carries a gas estimate. `dim` covers everything
// derived from the quote — slippage is a stable user setting and never goes stale. A static opacity, no
// transition, so nothing $-token flashes.
export function MarginAdjustShowMoreSection({
  isExpanded,
  onToggle,
  slippageToleranceBps,
  compoundsSlippage,
  gasDisplay,
  extraRows,
  dim,
}: {
  isExpanded: boolean
  onToggle: () => void
  slippageToleranceBps: number
  // TWO sequential swap legs, not merely a cross-token route: the payment→collateral conversion AND
  // the leverage swap, so the per-leg tolerance compounds to (1+s)²−1. A cross-token ADD also swaps
  // but is a single leg, so it must NOT set this — the name says what the branch keys on.
  compoundsSlippage?: boolean
  gasDisplay?: string
  extraRows?: ReactNode
  dim?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const slippageFraction = bpsToPercent(slippageToleranceBps) / 100
  const maxSlippageDisplay = compoundsSlippage
    ? `${(((1 + slippageFraction) ** 2 - 1) * 100).toFixed(2)}%`
    : `${bpsToPercent(slippageToleranceBps)}%`
  return (
    <>
      <MarginShowMoreToggle isExpanded={isExpanded} onToggle={onToggle} />
      {isExpanded ? (
        <Flex gap="$spacing12">
          {extraRows ? (
            <Flex gap="$spacing12" opacity={dim ? 0.5 : 1} testID={TestID.MarginShowMoreQuoteRows}>
              {extraRows}
            </Flex>
          ) : null}
          <MarginDetailRow label={t('margin.fees.maxSlippage')} value={maxSlippageDisplay} />
          {gasDisplay ? (
            <Flex opacity={dim ? 0.5 : 1}>
              <MarginDetailRow
                label={t('margin.fees.networkCost')}
                value={
                  <Flex row alignItems="center" gap="$spacing4">
                    <Gas size="$icon.16" color="$neutral2" />
                    <Text variant="body3" color="$neutral1">
                      {gasDisplay}
                    </Text>
                  </Flex>
                }
              />
            </Flex>
          ) : null}
        </Flex>
      ) : null}
    </>
  )
}
