import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { positionLeverage } from '~/pages/Swap/Margin/marginAdjustPositionMath'
import {
  formatLeverageX,
  getMarginDirectionStyle,
  lltvToPercent,
  marginVenueLabel,
} from '~/pages/Swap/Margin/marginFormat'
import {
  marginExposureLeg,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapSymbol,
} from '~/pages/Swap/Margin/marginTokenDisplay'

// Direction variant needs the position (current leverage lives on the ACTIVE row, not the market); the
// union enforces it so a consumer can't reach for a direction subtitle without one.
type MarginPairHeadingProps =
  | { market: MarginMarket; variant: 'venue' }
  | { market: MarginMarket; variant: 'direction'; position: MarginActivePosition }

// SplitLogo + "ETH / USDC" pair title with a subtitle: the lending venue + LLTV, or the position's
// direction + opened leverage in the direction color. Shared by the review + action modals.
export function MarginPairHeading(props: MarginPairHeadingProps): JSX.Element {
  const { market, variant } = props
  const { t } = useTranslation()
  const currencyInfos = useMarginCurrencyInfos()
  // Aave rows carry no LLTV ('0') — fall back to the bare venue label rather than "0% LLTV".
  const lltvPercent = lltvToPercent(market.lltvWad)

  return (
    <Flex row alignItems="center" gap="$spacing12">
      <SplitLogo
        size={32}
        inputCurrencyInfo={null}
        outputCurrencyInfo={null}
        chainId={MARGIN_CHAIN_ID}
        {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
      />
      {/* Flex defaults flexShrink 0, so the three-part direction subtitle would overflow the 420px
          sheet on a long symbol instead of wrapping. */}
      <Flex gap="$spacing2" flexShrink={1} minWidth={0}>
        <Text variant="subheading1" color="$neutral1">
          {marginPairLabel({ market })}
        </Text>
        {variant === 'venue' ? (
          <Flex row alignItems="center" gap="$spacing6">
            <MarginVenueLogo venue={market.venue} size="$icon.16" />
            <Text variant="body3" color="$neutral2">
              {lltvPercent > 0
                ? t('margin.market.venueLltv', { venue: marginVenueLabel(market.venue), lltv: Math.round(lltvPercent) })
                : marginVenueLabel(market.venue)}
            </Text>
          </Flex>
        ) : (
          <DirectionSubtitle market={market} position={props.position} />
        )}
      </Flex>
    </Flex>
  )
}

// The position as it stands right now: direction, current size, current leverage. Leverage here is
// CURRENT (off live equity), not the at-open figure — a drifted position rendering its opening leverage
// reads as "your leverage" and isn't. Leverage at open lives in the expanded row instead.
function DirectionSubtitle({
  market,
  position,
}: {
  market: MarginMarket
  position: MarginActivePosition
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const direction = position.direction
  const directionStyle = getMarginDirectionStyle(direction)
  const directionLabel = direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')
  // `size` is denominated in the exposure leg — a long's is its collateral, a short's its debt leg.
  const leg = marginExposureLeg({ market, direction })
  const size = Number(position.size) / 10 ** leg.decimals
  return (
    <Text variant="body3" color={directionStyle.color}>
      {t('margin.pair.directionSizeLeverage', {
        direction: directionLabel,
        size: `${formatNumberOrString({ value: size, type: NumberType.TokenNonTx })} ${marginUnwrapSymbol(leg)}`,
        leverage: formatLeverageX(positionLeverage(position) ?? Number.POSITIVE_INFINITY),
      })}
    </Text>
  )
}
