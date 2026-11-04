import { Flex, Text } from '@universe/mycelium'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { exposureUsdValue, scaledE18ToNumber, usableWireAmount } from '~/features/margin/utils/marginFormat'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useMarginMarketsStaleTick } from '~/pages/Swap/Margin/hooks/useMarginMarketsStaleTick'
import { displayMarkPriceX18, resolveRoutedMarkPriceX18 } from '~/pages/Swap/Margin/marginRoutedMarket'

// The receipt's Size value: exposure in the traded leg plus its USD value.
export function MarginSizeReceiptValue({
  derivedMarginInfo,
}: {
  derivedMarginInfo: DerivedMarginInfo
}): JSX.Element | null {
  // The freshness bound compares against Date.now(), which only advances a render — and the poll
  // going quiet is exactly when a mark ages out. Keeps the disclosure honest while this is on screen.
  useMarginMarketsStaleTick()

  const { formatNumberOrString } = useLocalizationContext()

  const { quote, market, direction } = derivedMarginInfo
  const { getLive, getMarketByTokens, dataUpdatedAt } = useMarginMarkets()

  if (!quote) {
    return null
  }

  // display.size is denominated in the exposure leg — a short's is its debt leg, a long's its collateral.
  const isShort = direction === MarginDirection.SHORT
  const exposureSymbol = isShort ? marginUnwrapSymbol(market.debt) : market.displaySymbol
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

  if (notional === undefined) {
    return (
      <Text variant="body3" color="$neutral3">
        —
      </Text>
    )
  }
  return (
    <Flex row alignItems="center" gap="$spacing4">
      <AnimatedNumber
        value={`${formatNumberOrString({ value: notional, type: NumberType.TokenTx })} ${exposureSymbol}`}
        numericValue={notional}
        textVariant="$body3"
        // An explicit color turns off the up-is-green flash, which doesn't fit a receipt figure.
        color="$neutral1"
      />
      {notionalUsd !== undefined ? (
        <AnimatedNumber
          value={`(${formatNumberOrString({ value: notionalUsd, type: NumberType.FiatStandard })})`}
          numericValue={notionalUsd}
          textVariant="$body3"
          color="$neutral2"
        />
      ) : null}
    </Flex>
  )
}
