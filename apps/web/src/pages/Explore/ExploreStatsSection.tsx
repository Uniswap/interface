import { DeltaArrow, DeltaText } from 'components/Tokens/TokenDetails/Delta'
import { LoadingBubble } from 'components/Tokens/loading'
import { Fragment, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { use24hProtocolVolume, useDailyTVLWithChange } from 'state/explore/protocolStats'
import { Flex, Popover, Text, isTouchable, useMedia, useShadowPropsMedium } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

interface ExploreStatSectionData {
  label: string
  value: string
  change: number
  protocolPopoverFormattedData?: {
    label: string
    value?: number
  }[]
}

const ExploreStatsSection = () => {
  const media = useMedia()
  const { t } = useTranslation()
  const { formatFiatPrice } = useFormatter()
  const isV4DataEnabled = useFeatureFlagWithLoading(FeatureFlags.V4Data)

  const {
    protocolVolumes,
    totalVolume,
    totalChangePercent: volume24hChangePercent,
    isLoading: isVolumeLoading,
  } = use24hProtocolVolume()
  const {
    totalTVL,
    protocolTVL,
    totalChangePercent: totalTVL24hrChangePercent,
    protocolChangePercent,
    isLoading: isTVLLoading,
  } = useDailyTVLWithChange()

  const isStatDataLoading = isVolumeLoading || isTVLLoading

  const exploreStatsSectionData = useMemo(() => {
    const formatPrice = (price: number) => formatFiatPrice({ price, type: NumberType.ChartFiatValue })

    const stats = [
      {
        label: t('stats.volume.1d.long'),
        value: formatPrice(totalVolume),
        change: volume24hChangePercent,
        protocolPopoverFormattedData: [
          { label: t('common.protocol.v4'), value: protocolVolumes.v4 },
          { label: t('common.protocol.v3'), value: protocolVolumes.v3 },
          { label: t('common.protocol.v2'), value: protocolVolumes.v2 },
        ],
      },
      { label: t('common.totalUniswapTVL'), value: formatPrice(totalTVL), change: totalTVL24hrChangePercent },
      { label: t('explore.v2TVL'), value: formatPrice(protocolTVL.v2), change: protocolChangePercent.v2 },
      { label: t('explore.v3TVL'), value: formatPrice(protocolTVL.v3), change: protocolChangePercent.v3 },
      isV4DataEnabled
        ? {
            label: t('explore.v4TVL'),
            value: formatPrice(protocolTVL.v4),
            change: protocolChangePercent.v4,
          }
        : null,
    ]

    return stats.filter((state): state is Exclude<typeof state, null> => state !== null)
  }, [
    t,
    formatFiatPrice,
    totalVolume,
    volume24hChangePercent,
    protocolVolumes.v4,
    protocolVolumes.v3,
    protocolVolumes.v2,
    totalTVL,
    totalTVL24hrChangePercent,
    protocolTVL.v2,
    protocolTVL.v3,
    protocolTVL.v4,
    protocolChangePercent.v2,
    protocolChangePercent.v3,
    protocolChangePercent.v4,
    isV4DataEnabled,
  ])

  return (
    <Flex row width="100%">
      {exploreStatsSectionData.map((data, index) => (
        <Flex
          key={data.label}
          borderLeftWidth={index === 0 ? 0 : '$spacing1'}
          borderColor="$surface3"
          pl={index == 0 ? 0 : '$spacing24'}
          flex={1}
          cursor={data.protocolPopoverFormattedData ? 'pointer' : 'default'}
          transition="opacity 0.3s ease, transform 0.3s ease"
          display={media.md && index > 1 ? 'none' : 'flex'}
        >
          {isTouchable || !data.protocolPopoverFormattedData ? (
            <StatDisplay data={data} isLoading={isStatDataLoading} />
          ) : (
            <StatDisplayWithPopover data={data} isLoading={isStatDataLoading} />
          )}
        </Flex>
      ))}
    </Flex>
  )
}

export default ExploreStatsSection

interface StatDisplayProps {
  data: ExploreStatSectionData
  isLoading?: boolean
  isHoverable?: boolean
}

const StatDisplay = memo(({ data, isLoading, isHoverable }: StatDisplayProps) => {
  const { formatDelta } = useFormatter()

  return (
    <Flex group gap="$spacing4" animation="simple">
      <Text variant="body4" color="$neutral2" $group-hover={{ opacity: isHoverable ? 0.8 : 1 }}>
        {data.label}
      </Text>
      {isLoading ? (
        <LoadingBubble height="20px" width="52px" />
      ) : (
        <Text variant="subheading1" color="$neutral1" $group-hover={{ opacity: isHoverable ? 0.8 : 1 }}>
          {data.value}
        </Text>
      )}
      <Flex row alignItems="center" gap="$spacing2" style={{ fontSize: 12 }}>
        {isLoading ? (
          <LoadingBubble height="12px" width="30px" />
        ) : (
          <Fragment>
            <DeltaArrow delta={data.change} size={12} />
            <DeltaText delta={data.change}>{formatDelta(data.change)}</DeltaText>
          </Fragment>
        )}
      </Flex>
    </Flex>
  )
})

StatDisplay.displayName = 'StatDisplay'

const StatDisplayWithPopover = memo(({ data, isLoading }: StatDisplayProps) => {
  const shadowProps = useShadowPropsMedium()
  const { formatFiatPrice } = useFormatter()
  const isV4DataEnabled = useFeatureFlagWithLoading(FeatureFlags.V4Data)

  return (
    <Popover hoverable placement="bottom-start" offset={{ mainAxis: 10 }}>
      <Popover.Trigger>
        <StatDisplay data={data} isLoading={isLoading} isHoverable />
      </Popover.Trigger>
      <Popover.Content
        borderColor="$surface2"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        animation="simple"
        {...shadowProps}
      >
        <Flex gap="$spacing8" px="$spacing4" py="$spacing6" width={180}>
          {data.protocolPopoverFormattedData?.map((item) => {
            if (item.label === 'Uniswap v4' && !isV4DataEnabled) {
              return null
            }

            return (
              <Flex key={item.label} row justifyContent="space-between">
                <Text variant="body4" color="neutral2">
                  {item.label}
                </Text>
                <Text variant="body4">
                  {formatFiatPrice({
                    price: item.value ?? 0,
                    type: NumberType.ChartFiatValue,
                  })}
                </Text>
              </Flex>
            )
          })}
        </Flex>
      </Popover.Content>
    </Popover>
  )
})

StatDisplayWithPopover.displayName = 'StatDisplayWithPopover'
