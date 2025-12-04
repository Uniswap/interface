import { LoadingBubble } from 'components/Tokens/loading'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { Fragment, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { use24hProtocolVolume, useDailyTVLWithChange } from 'state/explore/protocolStats'
import { AnimatePresence, Flex, isTouchable, Popover, Text, useMedia, useShadowPropsMedium } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

interface ExploreStatSectionData {
  label: string
  value: string
  change: number
  protocolPopoverFormattedData?: {
    label: string
    value?: number
  }[]
}

const ExploreStatsSection = ({ shouldHideStats = false }: { shouldHideStats?: boolean }) => {
  const media = useMedia()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

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
    const formatPrice = (price: number) => convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)

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
      { label: t('explore.v4TVL'), value: formatPrice(protocolTVL.v4), change: protocolChangePercent.v4 },
    ]

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return stats.filter((state): state is Exclude<typeof state, null> => state !== null)
  }, [
    t,
    convertFiatAmountFormatted,
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
  ])

  const visibleStats = media.md ? exploreStatsSectionData.slice(0, 2) : exploreStatsSectionData

  return (
    <AnimatePresence>
      {!shouldHideStats && (
        <Flex
          row
          width="100%"
          key="explore-stats"
          animation="300ms"
          enterStyle={{ opacity: 0, y: -10 }}
          exitStyle={{ opacity: 0, y: -10 }}
          transition="opacity 0.3s ease, transform 0.3s ease"
        >
          {visibleStats.map((data, index) => (
            <Flex
              key={data.label}
              borderLeftWidth={index === 0 ? 0 : '$spacing1'}
              borderColor="$surface3"
              pl={index === 0 ? 0 : '$spacing24'}
              flex={1}
              cursor={data.protocolPopoverFormattedData ? 'pointer' : 'default'}
              transition="opacity 0.3s ease, transform 0.3s ease"
            >
              {isTouchable || !data.protocolPopoverFormattedData ? (
                <StatDisplay data={data} isLoading={isStatDataLoading} />
              ) : (
                <StatDisplayWithPopover data={data} isLoading={isStatDataLoading} />
              )}
            </Flex>
          ))}
        </Flex>
      )}
    </AnimatePresence>
  )
}

export default ExploreStatsSection

interface StatDisplayProps {
  data: ExploreStatSectionData
  isLoading?: boolean
  isHoverable?: boolean
}

const StatDisplay = memo(({ data, isLoading, isHoverable }: StatDisplayProps) => {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  return (
    <Flex transition="all 0.1s ease-in-out" group gap="$spacing4" minHeight="$spacing60">
      <Text variant="body4" color="$neutral2" $group-hover={{ color: isHoverable ? '$neutral2Hovered' : '$neutral2' }}>
        {data.label}
      </Text>
      {isLoading ? (
        <LoadingBubble height="24px" width="80px" />
      ) : (
        <Text variant="subheading1" color="$neutral1">
          {data.value}
        </Text>
      )}
      <Flex row alignItems="center" gap="$spacing2" style={{ fontSize: 12 }} minHeight="$spacing16">
        {isLoading ? (
          <LoadingBubble height="12px" width="60px" />
        ) : (
          <Fragment>
            <DeltaArrow delta={data.change} formattedDelta={formatPercent(Math.abs(data.change))} size={12} />
            <Text variant="body4" color="$neutral1">
              {formatPercent(Math.abs(data.change))} {t('common.today').toLocaleLowerCase()}
            </Text>
          </Fragment>
        )}
      </Flex>
    </Flex>
  )
})

StatDisplay.displayName = 'StatDisplay'

const StatDisplayWithPopover = memo(({ data, isLoading }: StatDisplayProps) => {
  const shadowProps = useShadowPropsMedium()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Popover hoverable placement="bottom-start" offset={{ mainAxis: 10 }}>
      <Popover.Trigger>
        <StatDisplay data={data} isLoading={isLoading} isHoverable />
      </Popover.Trigger>
      <Popover.Content
        zIndex={zIndexes.popover}
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
            return (
              <Flex key={item.label} row justifyContent="space-between">
                <Text variant="body4" color="neutral2">
                  {item.label}
                </Text>
                <Text variant="body4">{convertFiatAmountFormatted(item.value ?? 0, NumberType.FiatTokenPrice)}</Text>
              </Flex>
            )
          })}
        </Flex>
      </Popover.Content>
    </Popover>
  )
})

StatDisplayWithPopover.displayName = 'StatDisplayWithPopover'
