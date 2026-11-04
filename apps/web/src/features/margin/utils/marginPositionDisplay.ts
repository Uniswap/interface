import type {
  MarginActivePosition,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import type { MarginMarket } from '~/constants/margin'
import type { MarginMarketResolver } from '~/features/margin/hooks/useResolveMarginMarket'
import { formatSignedFiat, rawToNumber } from '~/features/margin/utils/marginFormat'
import { marginPositionTokens, marginPositionVenue } from '~/features/margin/utils/marginPositionRow'
import {
  marginExposureLeg,
  marginUnwrapSymbol,
  resolveMarginFallbackSymbol,
} from '~/features/margin/utils/marginTokenDisplay'

// The wire dropped collateralToken/debtToken off the position row itself — every resolveMarket(row)
// call site now goes through here instead of re-deriving venue terms at each one.
export function resolveMarketForPosition({
  position,
  resolveMarket,
}: {
  position: MarginActivePosition | MarginTerminalPosition
  resolveMarket: MarginMarketResolver
}): MarginMarket | undefined {
  const { collateralToken, debtToken } = marginPositionTokens(position)
  return resolveMarket({
    collateralToken,
    debtToken,
    venue: marginPositionVenue(position),
    direction: position.direction,
  })
}

type FormatNumberOrString = ReturnType<typeof useLocalizationContext>['formatNumberOrString']

// Which leg a wire amount is denominated in. `size` is the exposure leg; equity and unrealized PnL are
// the collateral leg — the same token for a LONG, the stable counter token for a SHORT.
export type MarginAmountLeg = 'exposure' | 'collateral'

export function isShortCollateral({
  position,
  leg,
}: {
  position: MarginActivePosition | MarginTerminalPosition
  leg: MarginAmountLeg
}): boolean {
  return leg === 'collateral' && position.direction === MarginDirection.SHORT
}

// A raw wire amount as "<amount> <symbol>", for either tab. With a resolved market it reads the market's
// leg; with none it falls back to the wire's own exposure/counter token, whose decimals are always
// present — rendering the raw integer instead would misstate the figure by orders of magnitude. The
// fallback symbol is best-effort: a token outside the markets registry has none, and the pair column
// already carries the fallback label.
export function marginAmountLabel({
  raw,
  leg = 'exposure',
  position,
  market,
  currencyInfos,
  formatNumberOrString,
  signed = false,
}: {
  raw: string
  leg?: MarginAmountLeg
  position: MarginActivePosition | MarginTerminalPosition
  market: MarginMarket | undefined
  currencyInfos: Map<string, CurrencyInfo>
  formatNumberOrString: FormatNumberOrString
  signed?: boolean
}): string {
  const marketLeg = market
    ? leg === 'collateral'
      ? market.collateral
      : marginExposureLeg({ market, direction: position.direction })
    : undefined
  const wireToken = isShortCollateral({ position, leg }) ? position.counterToken : position.exposureToken
  const decimals = marketLeg ? marketLeg.decimals : wireToken.decimals
  const symbol = marketLeg
    ? marginUnwrapSymbol(marketLeg)
    : resolveMarginFallbackSymbol({ address: wireToken.address, currencyInfos })
  const format = (value: number): string => formatNumberOrString({ value, type: NumberType.TokenNonTx })
  const value = rawToNumber({ raw, decimals })
  const amount = signed ? formatSignedFiat({ value, format }) : format(value)
  return symbol ? `${amount} ${symbol}` : amount
}
