import { Flex, Text } from '@universe/mycelium'
import { Gas } from '@universe/mycelium/icons/Gas'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { bpsToPercent } from '~/features/margin/utils/marginFormat'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { MarginShowMoreToggle } from '~/pages/Swap/Margin/components/shared/MarginShowMoreToggle'

// Manage modals' collapsible detail section: caller-supplied rows (the borrowing before→after),
// max slippage always, and network cost when the quote carries a gas estimate. `dim` covers everything
// derived from the quote — slippage is a stable user setting and never goes stale. A static opacity, no
// transition, so nothing $-token flashes.
export function MarginAdjustShowMoreSection({
  isExpanded,
  onToggle,
  slippageToleranceBps,
  gasDisplay,
  extraRows,
  dim,
}: {
  isExpanded: boolean
  onToggle: () => void
  slippageToleranceBps: number
  gasDisplay?: string
  extraRows?: ReactNode
  dim?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const maxSlippageDisplay = `${bpsToPercent(slippageToleranceBps)}%`
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
