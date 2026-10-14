import { isTouchable } from '@universe/environment'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { Presence } from '@universe/mycelium/presence'
import { Fragment, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover, useShadowPropsMedium } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { LoadingBubble } from '~/components/Tokens/loading'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'

interface ExploreStatSectionData {
  label: string
  value: string
  balance: number
  percentChange?: number
  protocolPopoverFormattedData?: {
    label: string
    value?: number
  }[]
}

export const ExploreStatsSection = ({ shouldHideStats = false }: { shouldHideStats?: boolean }) => {
  const media = useMedia()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const {
    protocolVolumes,
    totalVolume,
    totalChangePercent: volumeChangePercent,
    isLoading: isVolumeLoading,
  } = use24hProtocolVolume()
  const {
    totalTVL,
    protocolTVL,
    totalChangePercent: tvlChangePercent,
    protocolChangePercent,
    isLoading: isTVLLoading,
  } = useDailyTVLWithChange()

  const isStatDataLoading = isVolumeLoading || isTVLLoading

  const exploreStatsSectionData = useMemo(() => {
    const formatPrice = (price: number) => convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)

    const stats: ExploreStatSectionData[] = [
      {
        label: t('stats.volume.1d.long'),
        value: formatPrice(totalVolume),
        balance: totalVolume,
        percentChange: volumeChangePercent,
        protocolPopoverFormattedData: [
          { label: t('common.protocol.v4'), value: protocolVolumes.v4 },
          { label: t('common.protocol.v3'), value: protocolVolumes.v3 },
          { label: t('common.protocol.v2'), value: protocolVolumes.v2 },
        ],
      },
      {
        label: t('common.totalUniswapTVL'),
        value: formatPrice(totalTVL),
        balance: totalTVL,
        percentChange: tvlChangePercent,
      },
      {
        label: t('explore.v2TVL'),
        value: formatPrice(protocolTVL.v2),
        balance: protocolTVL.v2,
        percentChange: protocolChangePercent.v2,
      },
      {
        label: t('explore.v3TVL'),
        value: formatPrice(protocolTVL.v3),
        balance: protocolTVL.v3,
        percentChange: protocolChangePercent.v3,
      },
      {
        label: t('explore.v4TVL'),
        value: formatPrice(protocolTVL.v4),
        balance: protocolTVL.v4,
        percentChange: protocolChangePercent.v4,
      },
    ]

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    return stats.filter((state): state is Exclude<typeof state, null> => state !== null)
  }, [
    t,
    convertFiatAmountFormatted,
    totalVolume,
    volumeChangePercent,
    protocolVolumes.v4,
    protocolVolumes.v3,
    protocolVolumes.v2,
    totalTVL,
    tvlChangePercent,
    protocolTVL.v2,
    protocolTVL.v3,
    protocolTVL.v4,
    protocolChangePercent.v2,
    protocolChangePercent.v3,
    protocolChangePercent.v4,
  ])

  const visibleStats = media.md ? exploreStatsSectionData.slice(0, 2) : exploreStatsSectionData

  return (
    <Presence>
      {!shouldHideStats && (
        <Flex
          row
          width="100%"
          key="explore-stats"
          className="animate-spore-enter-fade-in-down data-exiting:animate-spore-exit-fade-out-up opacity-[1]"
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
    </Presence>
  )
}

interface StatDisplayProps {
  data: ExploreStatSectionData
  isLoading?: boolean
  isHoverable?: boolean
}

const StatDisplay = memo(({ data, isLoading, isHoverable }: StatDisplayProps) => {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  return (
    <Flex transition="all 0.1s ease-in-out" group gap="$spacing4" minHeight={60}>
      <Text variant="body4" color="$neutral2" $group-hover={{ color: isHoverable ? '$neutral2Hovered' : '$neutral2' }}>
        {data.label}
      </Text>
      <AnimatedNumber numericValue={data.balance} loading={isLoading} textVariant="$subheading1" value={data.value} />
      <Flex row alignItems="center" gap="$spacing2" minHeight={16}>
        {isLoading ? (
          <LoadingBubble height={12} width={60} />
        ) : (
          data.percentChange !== undefined && (
            <Fragment>
              <DeltaArrow
                delta={data.percentChange}
                formattedDelta={formatPercent(Math.abs(data.percentChange))}
                size={12}
              />
              <Text variant="body4" color="$neutral1">
                {formatPercent(Math.abs(data.percentChange))} {t('common.today').toLocaleLowerCase()}
              </Text>
            </Fragment>
          )
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
    <Popover hoverable={{ delay: { open: 200 }, restMs: 100 }} placement="bottom-start" offset={{ mainAxis: 10 }}>
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
                <Text variant="body4" color="$neutral2">
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
