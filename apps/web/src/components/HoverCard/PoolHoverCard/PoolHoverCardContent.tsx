import { Flex, Shine, Text } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { Fragment, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { shortenPoolId, usePoolIdentityLabels } from 'uniswap/src/components/lists/items/pools/usePoolIdentityLabels'
import type { PoolOption } from 'uniswap/src/components/lists/items/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ChartUnavailableOverlay } from '~/components/Charts/ChartUnavailableOverlay'
import { ChartType } from '~/components/Charts/utils'
import {
  HoverCardBody,
  HoverCardDotSeparator,
  HoverCardHeadline,
  HoverCardIdentity,
} from '~/components/HoverCard/HoverCardContent'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'

const POOL_HOVER_CARD_CHART_HEIGHT = 74
const POOL_HOVER_CARD_BAR_COUNT = 24
const POOL_HOVER_CARD_LOGO_SIZE = 32
const BAR_GAP = 6
const BAR_RADIUS = 2
// Matches the dotted texture `useApplyChartTextureEffects` paints behind the token sparkline.
const DOT_GRID_SPACING = '20px 20px'

export type PoolHoverCardPool = Pick<
  PoolOption,
  | 'poolId'
  | 'chainId'
  | 'token0CurrencyInfo'
  | 'token1CurrencyInfo'
  | 'protocolVersion'
  | 'hookAddress'
  | 'feeTier'
  | 'volume1dUsd'
>

export type PoolHoverCardContentProps = PoolHoverCardPool & {
  /** Hourly volume over the last day, oldest first. */
  hourlyVolumes: number[]
  loading: boolean
  isCopied: boolean
  onCopy: () => void
  maxWidth?: number
}

function PoolIdentityMeta({
  chainId,
  protocolVersion,
  hookAddress,
  feeTier,
}: Pick<PoolHoverCardContentProps, 'chainId' | 'protocolVersion' | 'hookAddress' | 'feeTier'>): JSX.Element {
  const { versionLabel, feeLabel, hookLabel, hookMark } = usePoolIdentityLabels({
    chainId,
    protocolVersion,
    hookAddress,
    feeTier,
  })
  const labels = [versionLabel, feeLabel, hookLabel].filter((label): label is string => !!label)

  return (
    <Flex row alignItems="center" gap="$spacing8" py="$spacing4" minWidth={0}>
      {labels.map((label, index) => (
        <Fragment key={label}>
          {index > 0 && <HoverCardDotSeparator />}
          <Flex row shrink alignItems="center" gap="$spacing4" minWidth={0}>
            {label === hookLabel && hookMark}
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {label}
            </Text>
          </Flex>
        </Fragment>
      ))}
    </Flex>
  )
}

// Ramp echoing the PDP volume skeleton, laid out like this card's bars rather than the PDP chart's axes.
const SKELETON_BAR_HEIGHTS = Array.from(
  { length: POOL_HOVER_CARD_BAR_COUNT },
  (_, index) => [25, 45, 65, 85, 65, 45][index % 6] ?? 0,
)

function VolumeBarRow({ heightPercents, color }: { heightPercents: number[]; color: string }): JSX.Element {
  const colors = useSporeColors()
  return (
    <Flex
      row
      alignItems="flex-end"
      gap={BAR_GAP}
      height={POOL_HOVER_CARD_CHART_HEIGHT}
      width="100%"
      style={{
        backgroundImage: `radial-gradient(circle, ${colors.surface3Hovered.val} 1px, transparent 1px)`,
        backgroundSize: DOT_GRID_SPACING,
      }}
    >
      {heightPercents.map((heightPercent, index) => (
        <Flex
          // Positional: the bars are a fixed-length hourly series.
          key={index}
          flex={1}
          height={`${heightPercent}%`}
          borderTopLeftRadius={BAR_RADIUS}
          borderTopRightRadius={BAR_RADIUS}
          backgroundColor={color}
        />
      ))}
    </Flex>
  )
}

/** Static hourly bars: the card is a glance, so there is no scrub or crosshair like the PDP volume chart. */
function PoolVolumeBars({ loading, hourlyVolumes }: { loading: boolean; hourlyVolumes: number[] }): JSX.Element {
  const bars = hourlyVolumes.slice(-POOL_HOVER_CARD_BAR_COUNT)
  const maxVolume = Math.max(0, ...bars)

  if (loading) {
    return (
      <Shine>
        <VolumeBarRow heightPercents={SKELETON_BAR_HEIGHTS} color="$neutral3" />
      </Shine>
    )
  }

  if (maxVolume === 0) {
    return <ChartUnavailableOverlay type={ChartType.VOLUME} height={POOL_HOVER_CARD_CHART_HEIGHT} />
  }

  return <VolumeBarRow heightPercents={bars.map((volume) => (volume / maxVolume) * 100)} color="$accent1" />
}

function PoolHoverCardContentInner({
  poolId,
  chainId,
  token0CurrencyInfo,
  token1CurrencyInfo,
  protocolVersion,
  hookAddress,
  feeTier,
  volume1dUsd,
  hourlyVolumes,
  loading,
  isCopied,
  onCopy,
  maxWidth,
}: PoolHoverCardContentProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Recent-search rows carry no search stats, so the day's bars stand in for the 1D total.
  const volume = volume1dUsd ?? (hourlyVolumes.length > 0 ? hourlyVolumes.reduce((sum, v) => sum + v, 0) : undefined)
  const headlineLoading = volume1dUsd === undefined && loading

  const currencies = useMemo(
    () => [token0CurrencyInfo.currency, token1CurrencyInfo.currency],
    [token0CurrencyInfo, token1CurrencyInfo],
  )
  const servedLogos = useMemo(
    () => [
      { currency: token0CurrencyInfo.currency, logoUrl: token0CurrencyInfo.logoUrl ?? undefined },
      { currency: token1CurrencyInfo.currency, logoUrl: token1CurrencyInfo.logoUrl ?? undefined },
    ],
    [token0CurrencyInfo, token1CurrencyInfo],
  )

  return (
    <HoverCardBody
      identity={
        <HoverCardIdentity
          logo={
            <DoubleCurrencyLogo
              currencies={currencies}
              servedLogos={servedLogos}
              size={POOL_HOVER_CARD_LOGO_SIZE}
              orientation="stacked"
            />
          }
          title={`${token0CurrencyInfo.currency.symbol} / ${token1CurrencyInfo.currency.symbol}`}
          subtitle={shortenPoolId({ poolId, protocolVersion })}
        />
      }
      isCopied={isCopied}
      maxWidth={maxWidth}
      onCopy={onCopy}
    >
      <PoolIdentityMeta
        chainId={chainId}
        protocolVersion={protocolVersion}
        hookAddress={hookAddress}
        feeTier={feeTier}
      />
      {(headlineLoading || volume !== undefined) && (
        <HoverCardHeadline
          loading={headlineLoading}
          loadingPlaceholderText="$00.0M"
          value={volume !== undefined ? convertFiatAmountFormatted(volume, NumberType.FiatTokenStats) : ''}
          caption={
            <Text variant="body3" color="$neutral2">
              {t('pool.hoverCard.volume1d')}
            </Text>
          }
        />
      )}
      <PoolVolumeBars loading={loading} hourlyVolumes={hourlyVolumes} />
    </HoverCardBody>
  )
}

export const PoolHoverCardContent = memo(PoolHoverCardContentInner)
