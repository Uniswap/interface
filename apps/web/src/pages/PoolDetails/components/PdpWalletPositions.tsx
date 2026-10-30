import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityPositionStatusIndicator } from 'uniswap/src/features/positions/components/LiquidityPositionStatusIndicator'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { NumberType } from 'utilities/src/format/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { usePositionRangeDisplay } from '~/features/Liquidity/hooks/usePositionRangeDisplay'
import { useCurrencyInfo } from '~/hooks/Tokens'
import { useAccount } from '~/hooks/useAccount'
import { useSrcColor } from '~/hooks/useColor'
import { usePoolPositions } from '~/pages/PoolDetails/hooks/usePoolPositions'

const RANGE_BAR_HEIGHT = 8
// The grey end caps stand for "below range" / "above range"; an out-of-range marker sits in one.
const RANGE_BAR_CAP_WIDTH = 24
const MARKER_WIDTH = 10
const MARKER_HEIGHT = 12
const TICK_WIDTH_PX = 2
const TICK_PITCH_PX = 4

// `transition-opacity`, not `all`: `all` animates theme tokens and flashes on a light/dark toggle.
const PositionLink = styled(Link, {
  platform: 'web',
  base: 'flex w-full no-underline cursor-pointer transition-opacity duration-100 hover:opacity-80 active:opacity-60',
})

/** Where the current price sits along the bar, as a CSS `left`, in the bar's displayed price direction. */
function getMarkerLeft({
  tickCurrent,
  tickLower,
  tickUpper,
  pricesInverted,
}: {
  tickCurrent: number
  tickLower: number
  tickUpper: number
  pricesInverted: boolean
}): string {
  const tickFraction = (tickCurrent - tickLower) / (tickUpper - tickLower)
  // Ticks rise with token0's price; an inverted display reads the other way.
  const fraction = pricesInverted ? 1 - tickFraction : tickFraction
  if (fraction < 0) {
    return `${RANGE_BAR_CAP_WIDTH / 2}px`
  }
  if (fraction > 1) {
    return `calc(100% - ${RANGE_BAR_CAP_WIDTH / 2}px)`
  }
  return `calc(${RANGE_BAR_CAP_WIDTH}px + ${fraction} * (100% - ${2 * RANGE_BAR_CAP_WIDTH}px))`
}

/** The token's logo color, or neutral when none can be extracted — useColor's accent default would read as the token's own. */
function useTokenColorOrNeutral(currency: Currency): string {
  const colors = useSporeColors()
  const currencyInfo = useCurrencyInfo(currency)
  return (
    useSrcColor({
      src: currencyInfo?.logoUrl ?? undefined,
      currencyName: currency.name,
      defaultColor: colors.neutral3.val,
    }).tokenColor ?? colors.neutral3.val
  )
}

function RangeBar({
  position,
  pricesInverted,
}: {
  position: PositionInfo
  pricesInverted: boolean
}): JSX.Element | null {
  const color0 = useTokenColorOrNeutral(position.currency0Amount.currency)
  const color1 = useTokenColorOrNeutral(position.currency1Amount.currency)
  const { tickLower, tickUpper, poolOrPair } = position
  const tickCurrent = poolOrPair && 'tickCurrent' in poolOrPair ? poolOrPair.tickCurrent : undefined

  if (tickLower === undefined || tickUpper === undefined || tickCurrent === undefined || tickUpper <= tickLower) {
    return null
  }

  const [startColor, endColor] = pricesInverted ? [color1, color0] : [color0, color1]

  return (
    <Flex row height={RANGE_BAR_HEIGHT} my="$spacing8" position="relative">
      <Flex
        width={RANGE_BAR_CAP_WIDTH}
        backgroundColor="$surface3"
        borderTopLeftRadius="$roundedFull"
        borderBottomLeftRadius="$roundedFull"
        borderTopRightRadius="$rounded4"
        borderBottomRightRadius="$rounded4"
      />
      <Flex
        flex={1}
        // Token-colored gradient cut into ticks; colors come from the tokens' logos, so there's no theme token.
        style={{
          backgroundImage: `linear-gradient(to right, ${startColor}, ${endColor})`,
          maskImage: `repeating-linear-gradient(to right, #000 0 ${TICK_WIDTH_PX}px, transparent ${TICK_WIDTH_PX}px ${TICK_PITCH_PX}px)`,
          WebkitMaskImage: `repeating-linear-gradient(to right, #000 0 ${TICK_WIDTH_PX}px, transparent ${TICK_WIDTH_PX}px ${TICK_PITCH_PX}px)`,
        }}
      />
      <Flex
        width={RANGE_BAR_CAP_WIDTH}
        backgroundColor="$surface3"
        borderTopLeftRadius="$rounded4"
        borderBottomLeftRadius="$rounded4"
        borderTopRightRadius="$roundedFull"
        borderBottomRightRadius="$roundedFull"
      />
      <Flex
        position="absolute"
        top={-RANGE_BAR_HEIGHT}
        width={MARKER_WIDTH}
        height={MARKER_HEIGHT}
        backgroundColor="$neutral1"
        // calc() isn't a SpaceValue, so the position goes through style; the clip cuts a downward triangle.
        style={{
          left: getMarkerLeft({ tickCurrent, tickLower, tickUpper, pricesInverted }),
          transform: `translateX(-${MARKER_WIDTH / 2}px)`,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }}
      />
    </Flex>
  )
}

function PositionCard({ position }: { position: PositionInfo }): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const createdAgo = useAbbreviatedTimeString(position.createdAt ? position.createdAt * ONE_SECOND_MS : 0)
  const { minPrice, maxPrice, tokenASymbol, tokenBSymbol, pricesInverted } = usePositionRangeDisplay(position)

  return (
    <PositionLink to={getPositionUrl(position)}>
      <Flex
        width="100%"
        gap="$gap12"
        p="$padding16"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderStyle="solid"
        borderColor="$surface3"
      >
        <Flex gap="$spacing6">
          <Flex row justifyContent="space-between" alignItems="center">
            <LiquidityPositionStatusIndicator status={position.status} />
            {position.createdAt !== undefined && (
              <Text variant="body4" color="$neutral2">
                {createdAgo} {t('common.ago')}
              </Text>
            )}
          </Flex>
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="subheading1" color="$neutral1" numberOfLines={1} flexShrink={0}>
              {minPrice}
            </Text>
            <Text variant="subheading1" color="$neutral2">
              –
            </Text>
            <Text variant="subheading1" color="$neutral1" numberOfLines={1} flexShrink={0}>
              {maxPrice}
            </Text>
            <Text variant="subheading1" color="$neutral2" numberOfLines={1} minWidth={0}>
              {tokenASymbol}/{tokenBSymbol}
            </Text>
          </Flex>
        </Flex>
        <Flex gap="$spacing8">
          <Flex row gap="$spacing12">
            <Text flex={1} variant="body2" color="$neutral1" numberOfLines={1}>
              {convertFiatAmountFormatted(position.totalValueUsd, NumberType.FiatTokenPrice, '–')}{' '}
              <Text variant="body2" color="$neutral2">
                {t('pool.position.liquidity.suffix')}
              </Text>
            </Text>
            <Text flex={1} variant="body2" color="$neutral1" numberOfLines={1}>
              {convertFiatAmountFormatted(position.uncollectedFeesUsd, NumberType.FiatTokenPrice, '–')}{' '}
              <Text variant="body2" color="$neutral2">
                {t('pool.position.earned.suffix')}
              </Text>
            </Text>
          </Flex>
          <RangeBar position={position} pricesInverted={pricesInverted} />
        </Flex>
      </Flex>
    </PositionLink>
  )
}

/** The PDP revamp's side-panel list of the connected wallet's positions in this pool. */
export function PdpWalletPositions({
  poolAddress,
  chainId,
}: {
  poolAddress: string
  chainId: UniverseChainId
}): JSX.Element | null {
  const { t } = useTranslation()
  const account = useAccount()
  const { positions } = usePoolPositions({ account: account.address, chainId, poolIdOrAddress: poolAddress })

  if (!positions.length) {
    return null
  }

  return (
    <Flex gap="$gap12">
      <Text variant="body2" color="$neutral2">
        {t('pool.positions.title')}
      </Text>
      <Flex gap="$gap8">
        {positions.map((position) => (
          <PositionCard key={`${position.poolId}-${position.tokenId}-${position.version}`} position={position} />
        ))}
      </Flex>
    </Flex>
  )
}
