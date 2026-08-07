import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { iconSizes, opacifyRaw } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { SparklineChart } from '~/components/Charts/SparklineChart'
import { DeltaArrow, getDeltaTextColor } from '~/components/DeltaArrow/DeltaArrow'
import type { SparklineMap } from '~/data/types'
import { useSrcColor } from '~/hooks/useColor'
import { LaunchItem } from '~/pages/Launches/launchesModel'
import { LaunchpadLogo } from '~/pages/Launches/LaunchpadLogo'
import { usePoolsBrandGreen } from '~/pages/Launches/usePoolsBrandGreen'

const THUMBNAIL_SIZE = 48
const SPARKLINE_WIDTH = 116
const SPARKLINE_HEIGHT = 48
const LAUNCHPAD_ICON_SIZE = 20
// Bottom accent-glow strength over surface2 — brighter in dark mode so the wash reads.
const GLOW_OPACITY_DARK = 22
const GLOW_OPACITY_LIGHT = 12
// Shadow/Light/Short (trending variant) from the design.
const TRENDING_CARD_SHADOW = '0 1px 6px 2px rgba(0,0,0,0.03), 0 1px 2px 0 rgba(0,0,0,0.02)'

/**
 * Launchpad identity pill — the token's registry icon + label in a bordered chip, anchored to
 * the card's bottom-right. Renders the same for every launchpad.
 */
function LaunchpadPill({ launch }: { launch: LaunchItem }): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing6"
      px="$spacing8"
      py="$spacing6"
      borderRadius="$rounded12"
      borderWidth={1}
      borderColor="$surface3"
      backgroundColor="$surface1"
    >
      <LaunchpadLogo size={LAUNCHPAD_ICON_SIZE} url={launch.launchpadLogoUrl} name={launch.launchpadLabel} />
      <Text variant="body3" color="$neutral1" numberOfLines={1}>
        {launch.launchpadLabel}
      </Text>
    </Flex>
  )
}

/**
 * Trending launch card: per-token extracted color drives a soft accent glow rising from the card
 * foot, a floating trailing-1h price sparkline in the top right, the name stacked over its ticker,
 * a value-first FDV line (with 1h delta) over the volume stat, and the launchpad identity pill
 * anchored bottom-right.
 */
export function TrendingLaunchCard({
  launch,
  tabIndex,
  index,
  listLength,
}: {
  launch: LaunchItem
  /** Pass -1 for marquee clones: aria-hidden duplicates must not be keyboard-focusable. */
  tabIndex?: number
  /** 1-based position in the trending feed, reported on the click event. */
  index: number
  listLength: number
}): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Fire before navigate so the event isn't lost to the route transition (stocks-shelf pattern).
  const onPress = launch.detailPath
    ? (): void => {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.LaunchesTrendingCarouselCard,
          chain_id: launch.logoChainId,
          token_address: launch.tokenAddress,
          token_symbol: launch.symbol,
          launchpad_id: launch.launchpadId,
          is_quick_launch: launch.isQuickLaunch,
          launch_list_index: index,
          launch_list_length: listLength,
        })
        navigate(launch.detailPath as string, { state: { from: pathname } })
      }
    : undefined
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const poolsBrandGreen = usePoolsBrandGreen()
  const { convertFiatAmountFormatted, formatNumberOrString, formatPercent } = useLocalizationContext()

  // Per-token extracted accent drives the glow; falls back to the brand green.
  const { tokenColor } = useSrcColor({
    src: launch.logoUrl,
    currencyName: launch.name,
    backgroundColor: colors.surface2.val,
    defaultColor: poolsBrandGreen,
  })
  const accentColor = tokenColor ?? poolsBrandGreen

  const backgroundStyle = useMemo(() => {
    const glow = opacifyRaw(isDarkMode ? GLOW_OPACITY_DARK : GLOW_OPACITY_LIGHT, accentColor)
    return {
      backgroundImage: `radial-gradient(90% 70% at 60% 118%, ${glow} 0%, transparent 60%)`,
    }
  }, [accentColor, isDarkMode])

  // Keyed map so the literal Explore-table sparkline renders the launch's served price points.
  const sparklineMap = useMemo<SparklineMap>(() => ({ [launch.id]: launch.sparkline }), [launch.id, launch.sparkline])
  const hasSparkline = (launch.sparkline?.length ?? 0) > 1

  const formattedFdv =
    launch.fdvUsd !== undefined ? convertFiatAmountFormatted(launch.fdvUsd, NumberType.FiatTokenStats) : undefined
  const formattedVolume =
    launch.volume24hUsd !== undefined
      ? formatNumberOrString({ value: launch.volume24hUsd, type: NumberType.FiatTokenStats })
      : undefined
  const delta = launch.priceChangePercent1h
  const volumeLabel = launch.isQuickLaunch ? t('launches.card.committedVol') : t('launches.card.volume24h')

  return (
    <TouchableArea
      testID={TestID.TrendingLaunchCard}
      tabIndex={tabIndex}
      backgroundColor="$surface2"
      borderRadius="$rounded20"
      p="$spacing12"
      flexDirection="column"
      gap="$spacing16"
      overflow="hidden"
      hoverStyle={{ opacity: 0.9 }}
      $platform-web={{ ...backgroundStyle, boxShadow: TRENDING_CARD_SHADOW }}
      onPress={onPress}
    >
      {hasSparkline && (
        <Flex position="absolute" top="$spacing12" right="$spacing12" pointerEvents="none">
          <SparklineChart
            width={SPARKLINE_WIDTH}
            height={SPARKLINE_HEIGHT}
            multichainId={launch.id}
            pricePercentChange={launch.priceChangePercent1h}
            sparklineMap={sparklineMap}
            color={accentColor}
            strokeFadeIn
          />
        </Flex>
      )}

      <Flex row gap={10} alignItems="center">
        <TokenLogo
          chainId={launch.logoChainId}
          size={THUMBNAIL_SIZE}
          symbol={launch.symbol}
          name={launch.name}
          url={launch.logoUrl}
        />
        <Flex flex={1} minWidth={0} gap="$spacing2">
          <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
            {launch.name}
          </Text>
          <Text variant="body2" color="$neutral2" numberOfLines={1}>
            {launch.symbol}
          </Text>
        </Flex>
      </Flex>

      <Flex gap="$spacing6">
        {formattedFdv !== undefined && (
          <Flex row alignItems="center" gap="$gap4">
            <Text variant="subheading2" color="$neutral1">
              {formattedFdv}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('launches.card.fdv')}
            </Text>
            {delta !== undefined && (
              <Flex row alignItems="center" gap="$gap4" ml="$spacing4">
                <DeltaArrow delta={delta} formattedDelta={formatPercent(Math.abs(delta))} size={iconSizes.icon16} />
                <Text variant="body3" color={getDeltaTextColor(delta)}>
                  {formatPercent(Math.abs(delta))}
                </Text>
              </Flex>
            )}
          </Flex>
        )}

        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
          {formattedVolume !== undefined ? (
            <Flex row alignItems="baseline" gap="$gap4" minWidth={0}>
              <Text variant="body4" color="$neutral1" numberOfLines={1}>
                {formattedVolume}
              </Text>
              <Text variant="body4" color="$neutral2" numberOfLines={1}>
                {volumeLabel}
              </Text>
            </Flex>
          ) : (
            <Flex />
          )}
          <LaunchpadPill launch={launch} />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
