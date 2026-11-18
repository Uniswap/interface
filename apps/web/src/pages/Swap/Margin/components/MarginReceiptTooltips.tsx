import { Flex, Separator, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { formatLeverage, formatSignedFiat } from '~/features/margin/utils/marginFormat'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import type { MarginReceiptDetails } from '~/pages/Swap/Margin/marginReceiptDetails'

// Two decimals: the receipt compares venues a few basis points apart. U+2212 minus.
export function formatSignedPct(pct: number): string {
  return `${pct < 0 ? '−' : '+'}${Math.abs(pct).toFixed(2)}%`
}

// Label left, figure right, in body4. A figure that reduces the total (a negative one) reads red.
function row(label: string, value: string | undefined): JSX.Element {
  const isCost = value?.startsWith('−') || value?.startsWith('-')
  const figure = (
    <Text variant="body4" color={isCost ? '$statusCritical' : '$neutral1'}>
      {value ?? '—'}
    </Text>
  )
  return <MarginDetailRow key={label} textVariant="body4" label={label} value={figure} />
}

function useFiat(): (value: number | undefined) => string | undefined {
  const { formatNumberOrString } = useLocalizationContext()
  return (value) => (value === undefined ? undefined : formatNumberOrString({ value, type: NumberType.FiatTokenPrice }))
}

/** Entry price as a sum: the market price, what impact and fees move it by, then the entry, then the worst case. */
export function MarginEntryTooltip({ entry }: { entry: MarginReceiptDetails['entry'] }): JSX.Element {
  const { t } = useTranslation()
  const fiat = useFiat()
  const { impactPct, feePct, blend } = entry
  const slippage = `${(entry.slippageBps / 100).toFixed(2)}%`
  return (
    <Flex gap="$spacing6">
      <Text variant="body4" color="$neutral2">
        {t('margin.receipt.entry.definition')}
      </Text>
      {row(t('common.marketPrice'), fiat(entry.mark))}
      {row(t('margin.receipt.entry.priceImpact'), impactPct === undefined ? undefined : formatSignedPct(impactPct))}
      {row(t('common.fees'), feePct === undefined ? undefined : formatSignedPct(-feePct))}
      <Separator />
      {/* A long paying with its collateral enters at its deposit's mark blended with what the borrow bought. */}
      {blend
        ? row(t('margin.receipt.entry.blended'), fiat(blend.blended))
        : row(t('margin.receipt.entry.quoted'), fiat(entry.fill))}
      {row(t('margin.receipt.entry.worstCase', { slippage }), fiat(entry.worstCase))}
    </Flex>
  )
}

/** Christian's reference: how the venue liquidates, then what a liquidation at that price leaves you. */
export function MarginLiquidationTooltip({
  liquidation: { style, price, equityUsd, keptUsd, keptCollateral },
  collateralSymbol,
}: {
  liquidation: MarginReceiptDetails['liquidation']
  collateralSymbol: string
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const fiat = useFiat()
  const isPartial = style === 'partial'
  const equity =
    equityUsd === undefined ? undefined : formatSignedFiat({ value: equityUsd, format: (v) => fiat(v) ?? '' })
  const held =
    keptCollateral === undefined ? undefined : formatNumberOrString({ value: keptCollateral, type: NumberType.TokenTx })
  return (
    <Flex gap="$spacing6">
      {style ? (
        <>
          <Text variant="body3" color="$neutral1">
            {isPartial ? t('margin.receipt.liq.partialTitle') : t('margin.receipt.liq.fullTitle')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {isPartial ? t('margin.receipt.liq.partialBody') : t('margin.receipt.liq.fullBody')}
          </Text>
          <Separator />
        </>
      ) : null}
      <Text variant="body4" color="$neutral2">
        {t('margin.receipt.liq.ifLiquidatedAt', { price: fiat(price) ?? '—' })}
      </Text>
      {row(t('margin.receipt.liq.equityAtLiquidation'), equity)}
      {/* Not on the wire yet. */}
      {row(t('margin.receipt.liq.penalty'), undefined)}
      <Separator />
      {row(t('margin.receipt.liq.youKeep'), fiat(keptUsd))}
      {row(t('margin.receipt.liq.heldAs'), held && `≈ ${held} ${collateralSymbol}`)}
    </Flex>
  )
}

/** The leveraged rate in words: the debt's rate, what the collateral earns (not on the wire yet), the net. */
export function MarginLeveragedRateTooltip({
  ratePct,
  borrowRatePct,
  leverage,
  debtSymbol,
  collateralSymbol,
}: {
  ratePct: number | undefined
  borrowRatePct: number | undefined
  leverage: number
  debtSymbol: string
  collateralSymbol: string
}): JSX.Element {
  const { t } = useTranslation()
  // A rate the trader pays reads negative.
  const paid = (pct: number | undefined): string | undefined => (pct === undefined ? undefined : formatSignedPct(-pct))
  return (
    <Flex gap="$spacing6">
      <Text variant="body4" color="$neutral2">
        {t('margin.receipt.leveragedRate.definition')}
      </Text>
      {row(t('margin.receipt.rate.borrowApy', { symbol: debtSymbol }), paid(borrowRatePct))}
      {row(t('margin.receipt.rate.collateralApy', { symbol: collateralSymbol }), undefined)}
      {row(t('margin.receipt.leveragedRate.leverage'), formatLeverage(leverage))}
      <Separator />
      {row(t('margin.receipt.leveragedRate.rate'), paid(ratePct))}
      {row(t('margin.receipt.leveragedRate.marginRate'), paid(ratePct === undefined ? undefined : ratePct * leverage))}
    </Flex>
  )
}
