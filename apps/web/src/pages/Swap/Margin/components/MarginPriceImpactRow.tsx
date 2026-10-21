import { Percent } from '@uniswap/sdk-core'
import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { marginPriceImpactSeverity } from '~/pages/Swap/Margin/marginPriceImpact'

// The leverage swap's fill against the venue's oracle mark. Rendered only once the fill is
// materially worse than the mark — below the swap surface's warning threshold it is noise. Shared by
// the adjust modals and the close modal, which both render MarginDetailRow; the open form has its own
// row shape and formats the same figure inline.
export function MarginPriceImpactRow({
  impactBps,
  markIsStale,
}: {
  impactBps: number | undefined
  // True where the figure was measured against a mark the freshness bound would otherwise have
  // withheld. Impact IS mark-vs-fill, so it cannot fall back to the fill the way the risk figures do —
  // the choice is a delayed figure or no disclosure at all, and this caption is what makes the first
  // one honest. REQUIRED: a `= false` default is what let this ship with no producer at all, the row
  // silently rendering a delayed mark as current.
  markIsStale: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const severity = marginPriceImpactSeverity(impactBps)
  // Below the warning threshold the figure is noise — EXCEPT against an aged mark, where the row is
  // the only thing that discloses the delay. A mark stale from before a large move computes a small
  // impact just as easily as a large one, so gating the caption on severity would withhold it in
  // exactly the case it exists for.
  if (impactBps === undefined || (severity === undefined && !markIsStale)) {
    return null
  }
  const color = severity ? getAlertColor(severity).text : '$neutral1'
  const priceImpact = new Percent(impactBps, 10_000)
  const absPriceImpact = priceImpact.lessThan(0) ? priceImpact.multiply(-1) : priceImpact
  return (
    <MarginDetailRow
      label={t('swap.priceImpact')}
      tooltip={markIsStale ? t('margin.priceImpact.delayedMark') : undefined}
      value={
        <Flex row alignItems="center" gap="$spacing4">
          {severity ? <AlertTriangleFilled size="$icon.16" color={color} /> : null}
          <Text variant="body3" color={color}>
            {formatPercent(absPriceImpact.toFixed(3))}
          </Text>
        </Flex>
      }
    />
  )
}
