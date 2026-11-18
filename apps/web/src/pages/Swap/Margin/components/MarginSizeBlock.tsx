import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { exposureUsdValue, scaledE18ToNumber, usableWireAmount } from '~/features/margin/utils/marginFormat'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { useMarginReceiptEstimate } from '~/pages/Swap/Margin/components/MarginReceiptEstimate'
import { type DerivedMarginInfo, quoteRefetchPulseClass } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useMarginMarketsStaleTick } from '~/pages/Swap/Margin/hooks/useMarginMarketsStaleTick'
import { displayMarkPriceX18, resolveRoutedMarkPriceX18 } from '~/pages/Swap/Margin/marginRoutedMarket'

// The position size: exposure in the traded leg plus its USD value, at the form's leverage. The
// estimate's until a quote lands.
export function useMarginSizeFigures(derivedMarginInfo: DerivedMarginInfo): {
  notional?: number
  notionalUsd?: number
  exposureSymbol: string
} {
  // The freshness bound compares against Date.now(), which only advances a render — and the poll
  // going quiet is exactly when a mark ages out. Keeps the disclosure honest while this is on screen.
  useMarginMarketsStaleTick()

  const { quote, market, direction } = derivedMarginInfo
  const { getLive, getMarketByTokens, dataUpdatedAt } = useMarginMarkets()
  const leverage = useMarginFormStore((s) => s.leverage)
  const estimate = useMarginReceiptEstimate(derivedMarginInfo)

  // display.size is denominated in the exposure leg — a short's is its debt leg, a long's its collateral.
  const isShort = direction === MarginDirection.SHORT
  const exposureSymbol = isShort ? marginUnwrapSymbol(market.debt) : market.displaySymbol
  if (!quote) {
    const { size, oraclePrice } = estimate ?? {}
    return { notional: size, notionalUsd: size && oraclePrice && size * oraclePrice, exposureSymbol }
  }
  const notional =
    quote.display.size !== undefined
      ? // Decoded off the QUOTE's own declared exposure decimals, not the form market's: a quote whose
        // pair drifted from the form's would otherwise render at the wrong scale.
        usableWireAmount({ raw: quote.display.size, decimals: quote.exposureToken.decimals })
      : undefined
  // Valued at the routed venue's mark from the markets poll while the poll is fresh, else at the quote's
  // own fill price. The receipt's other mark-relative figures (impact, liquidation distance, break-even)
  // read the quote's display.oraclePrice instead, so this USD value can sit off them by however far the
  // poll's mark has moved since the quote.
  const routedMarkPriceX18 = resolveRoutedMarkPriceX18({
    market,
    quote,
    getMarketByTokens,
    getLive,
    marketsUpdatedAt: dataUpdatedAt,
  }).priceX18
  const usableMark = displayMarkPriceX18({ markPriceX18: routedMarkPriceX18, quote })
  const markPrice = usableMark ? scaledE18ToNumber(usableMark) : undefined
  const notionalUsd =
    notional !== undefined && markPrice !== undefined
      ? exposureUsdValue({ exposureAmount: notional, mark: markPrice })
      : undefined

  // Restated from the leverage the quote was priced at, so the size follows the slider while the
  // debounced requote catches up.
  const quotedLeverage = Number(quote.display.leverage)
  const scale = quotedLeverage > 0 ? leverage / quotedLeverage : 1
  return {
    notional: notional === undefined ? undefined : notional * scale,
    notionalUsd: notionalUsd === undefined ? undefined : notionalUsd * scale,
    exposureSymbol,
  }
}

// Read-only Size row under the Deposit card, styled like Pay with: the fiat value with the token figure
// under it at the right. Without a mark the token figure is the only size there is, so it takes the top.
export function MarginSizeBlock({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element {
  return (
    <MarginSizeBox {...useMarginSizeFigures(derivedMarginInfo)} className={quoteRefetchPulseClass(derivedMarginInfo)} />
  )
}

export function MarginSizeBox({
  notional,
  notionalUsd,
  exposureSymbol,
  className,
}: {
  notional?: number
  notionalUsd?: number
  exposureSymbol: string
  className?: string
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const token =
    notional === undefined
      ? undefined
      : `${formatNumberOrString({ value: notional, type: NumberType.TokenTx })} ${exposureSymbol}`
  const fiat =
    notionalUsd === undefined ? undefined : formatNumberOrString({ value: notionalUsd, type: NumberType.FiatStandard })
  const headline = fiat ?? token

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing12"
      p="$spacing16"
      borderRadius="$rounded20"
      backgroundColor="$surface2"
    >
      <Text variant="subheading2" color="$neutral2">
        {t('margin.size.label')}
      </Text>
      <Flex shrink minWidth={0} alignItems="flex-end" gap="$spacing2" className={className}>
        {headline ? (
          <AnimatedNumber
            value={headline}
            numericValue={fiat ? notionalUsd : notional}
            textVariant="$subheading1"
            // An explicit color turns off the up-is-green flash, which doesn't fit a read-only figure.
            color="$neutral1"
            alignRight
            ellipsis
          />
        ) : (
          <Text variant="subheading1" color="$neutral3">
            —
          </Text>
        )}
        {fiat && token ? (
          <Text variant="body3" color="$neutral2" numberOfLines={1}>
            {token}
          </Text>
        ) : null}
      </Flex>
    </Flex>
  )
}
