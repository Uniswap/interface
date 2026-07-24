import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Popover, Text, useIsTouchDevice, useShadowPropsMedium } from 'ui/src'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkPile } from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { type TdpChainSelection, TdpChainSelectionType } from 'uniswap/src/utils/linking'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { TimePeriod } from '~/appGraphql/data/util'
import { adjustItemWidths, MIN_BAR_WIDTH } from '~/components/PercentageAllocationChart/chartUtils'
import { PercentageBars } from '~/components/PercentageAllocationChart/PercentageBars'
import type { PercentageAllocationItem } from '~/components/PercentageAllocationChart/types'
import { useChartHover } from '~/components/PercentageAllocationChart/useChartHover'
import { useTopNetworkBarColors } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/useTopNetworkBarColors'
import {
  getPercentageDisplay,
  getVolumeBreakdownForPeriod,
  getVolumeLabelForTimePeriod,
  navigateVolumePopoverToTokenDetails,
} from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/utils'
import {
  VolumeBreakdownRow,
  VolumeBreakdownRowLabel,
  type VolumeHoverSource,
} from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/VolumeBreakdownRow'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'

const MAX_VISIBLE_NETWORKS = 3
const POPOVER_MIN_WIDTH = 300
const COLOR_DOT_SIZE = 6

interface VolumeByNetworkPopoverProps {
  rankedToken: RankedMultichainToken | undefined
  timePeriod: TimePeriod
  volumeFormatted: string
  children: ReactNode
  minBarWidth?: number
}

export function VolumeByNetworkPopover({
  rankedToken,
  timePeriod,
  volumeFormatted,
  children,
  minBarWidth = MIN_BAR_WIDTH,
}: VolumeByNetworkPopoverProps): JSX.Element {
  const { t } = useTranslation()
  const shadowProps = useShadowPropsMedium()
  const isTouchDevice = useIsTouchDevice()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { hoveredItemId, onHover } = useChartHover()
  const [hoverSource, setHoverSource] = useState<VolumeHoverSource | null>(null)
  const [listSurfaceItemId, setListSurfaceItemId] = useState<string | null>(null)

  const onBarHover = useEvent((id: string | null) => {
    onHover(id)
    setHoverSource(id === null ? null : 'bar')
  })

  const onRowHover = useEvent((id: string | null) => {
    onHover(id)
    setHoverSource(id === null ? null : 'row')
  })
  const { ref: barContainerRef, width: chartWidth } = useResizeObserver<HTMLElement>()
  const navigateToTokenDetails = useNavigateToTokenDetails()

  const breakdown = useMemo(
    () => getVolumeBreakdownForPeriod(rankedToken, timePeriod).filter((b) => isUniverseChainId(b.chainId)),
    [rankedToken, timePeriod],
  )
  const totalVolume = useMemo(() => breakdown.reduce((sum, { volume }) => sum + volume, 0), [breakdown])

  const topChains = useMemo(
    () =>
      breakdown.slice(0, MAX_VISIBLE_NETWORKS).map((b) => ({ chainId: b.chainId, name: getChainInfo(b.chainId).name })),
    [breakdown],
  )
  const networkColors = useTopNetworkBarColors(topChains)

  const chartItems: PercentageAllocationItem[] = useMemo(() => {
    if (totalVolume <= 0 || breakdown.length === 0) {
      return []
    }
    const top = breakdown.slice(0, MAX_VISIBLE_NETWORKS)
    const rest = breakdown.slice(MAX_VISIBLE_NETWORKS)
    const items: PercentageAllocationItem[] = top.map(({ chainId, volume }, i) => {
      const percentage = totalVolume === 0 ? 0 : (volume / totalVolume) * 100
      return {
        id: `chain-${chainId}`,
        percentage,
        color: networkColors[i],
        label: getChainInfo(chainId).name,
        icon: <NetworkLogo chainId={chainId} size={iconSizes.icon12} />,
      }
    })
    if (rest.length > 0) {
      const otherVolume = rest.reduce((sum, { volume }) => sum + volume, 0)
      items.push({
        id: 'other',
        percentage: (otherVolume / totalVolume) * 100,
        color: '$neutral3',
        label: t('common.others'),
      })
    }
    return items
  }, [t, breakdown, totalVolume, networkColors])

  const adjustedItems = useMemo(
    () => adjustItemWidths({ t, items: chartItems, chartWidth, minBarWidth }),
    [t, chartItems, chartWidth, minBarWidth],
  )

  const otherVolumeSum = useMemo(
    () =>
      breakdown.length > MAX_VISIBLE_NETWORKS
        ? breakdown.slice(MAX_VISIBLE_NETWORKS).reduce((sum, { volume }) => sum + volume, 0)
        : 0,
    [breakdown],
  )

  const showPopover = chartItems.length > 0 && !isTouchDevice && breakdown.length > 1

  if (!showPopover) {
    return <>{children}</>
  }

  return (
    <Popover
      hoverable={{ delay: { open: 200 }, restMs: 100 }}
      placement="bottom-start"
      stayInFrame
      allowFlip
      offset={{ mainAxis: 10 }}
    >
      <Popover.Trigger>
        <Flex
          cursor="default"
          flex={1}
          minWidth={0}
          onPressIn={(e) => e.stopPropagation()}
          onPressOut={(e) => e.stopPropagation()}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Flex>
      </Popover.Trigger>
      <Popover.Content
        zIndex={zIndexes.popover}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        animation="quick"
        animateOnly={['transform', 'opacity']}
        p="$spacing16"
        px="$spacing8"
        minWidth={POPOVER_MIN_WIDTH}
        onPress={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...shadowProps}
      >
        <Flex gap="$spacing8" width="100%">
          <Flex row justifyContent="space-between" alignItems="baseline" px="$spacing8">
            <Text variant="body2" color="$neutral2">
              {getVolumeLabelForTimePeriod(t, timePeriod)}
            </Text>
            <Text variant="body2" color="$neutral1">
              {volumeFormatted}
            </Text>
          </Flex>

          <Flex ref={barContainerRef} width="100%" px="$spacing4">
            <PercentageBars
              adjustedItems={adjustedItems}
              hoveredItemId={hoveredItemId}
              onHover={onBarHover}
              minBarWidth={minBarWidth}
              colorSegments
            />
          </Flex>

          {breakdown.length > 0 && (
            <Flex>
              {breakdown.slice(0, MAX_VISIBLE_NETWORKS).map(({ chainId, volume }, i) => {
                const itemId = `chain-${chainId}`

                return (
                  <VolumeBreakdownRow
                    key={chainId}
                    hoveredItemId={hoveredItemId}
                    hoverSource={hoverSource}
                    listSurfaceItemId={listSurfaceItemId}
                    itemId={itemId}
                    onRowHover={onRowHover}
                    onListSurfaceHover={setListSurfaceItemId}
                    onPress={() =>
                      navigateVolumePopoverToTokenDetails({
                        navigateToTokenDetails,
                        rankedToken,
                        chainId,
                      })
                    }
                  >
                    <Flex row alignItems="center" gap="$spacing8" flex={1} minWidth={0}>
                      <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
                      <VolumeBreakdownRowLabel
                        primaryLabel={convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)}
                        hoverLabel={getChainInfo(chainId).name}
                      />
                    </Flex>
                    <Flex row alignItems="center" gap="$spacing8">
                      <Text variant="body3" color="$neutral2">
                        {getPercentageDisplay(volume, totalVolume)}
                      </Text>
                      <Flex
                        width={COLOR_DOT_SIZE}
                        height={COLOR_DOT_SIZE}
                        borderRadius="$roundedFull"
                        backgroundColor={networkColors[i]}
                        flexShrink={0}
                      />
                    </Flex>
                  </VolumeBreakdownRow>
                )
              })}
              {breakdown.length > MAX_VISIBLE_NETWORKS && (
                <VolumeBreakdownRow
                  hoveredItemId={hoveredItemId}
                  hoverSource={hoverSource}
                  listSurfaceItemId={listSurfaceItemId}
                  itemId="other"
                  onRowHover={onRowHover}
                  onListSurfaceHover={setListSurfaceItemId}
                  onPress={() => {
                    const firstOtherBreakdown = breakdown[MAX_VISIBLE_NETWORKS]
                    // One hidden network: open its chain-specific page (omit selection). Multiple: open the aggregate view.
                    const chainSelection: TdpChainSelection | undefined =
                      breakdown.length === MAX_VISIBLE_NETWORKS + 1
                        ? undefined
                        : { type: TdpChainSelectionType.Multichain }
                    navigateVolumePopoverToTokenDetails({
                      navigateToTokenDetails,
                      rankedToken,
                      chainId: firstOtherBreakdown.chainId,
                      chainSelection,
                    })
                  }}
                >
                  <Flex row alignItems="center" gap="$spacing8" flex={1} minWidth={0}>
                    <NetworkPile
                      chainIds={breakdown.slice(MAX_VISIBLE_NETWORKS).map(({ chainId }) => chainId)}
                      size="small"
                    />
                    <VolumeBreakdownRowLabel
                      primaryLabel={convertFiatAmountFormatted(otherVolumeSum, NumberType.FiatTokenStats)}
                      hoverLabel={t('common.others')}
                    />
                  </Flex>
                  <Flex row alignItems="center" gap="$spacing8">
                    <Text variant="body3" color="$neutral2">
                      {getPercentageDisplay(otherVolumeSum, totalVolume)}
                    </Text>
                    <Flex
                      width={COLOR_DOT_SIZE}
                      height={COLOR_DOT_SIZE}
                      borderRadius="$roundedFull"
                      backgroundColor="$neutral3"
                      flexShrink={0}
                    />
                  </Flex>
                </VolumeBreakdownRow>
              )}
            </Flex>
          )}
        </Flex>
      </Popover.Content>
    </Popover>
  )
}
