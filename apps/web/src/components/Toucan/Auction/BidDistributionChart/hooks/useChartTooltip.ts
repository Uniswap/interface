import { TOOLTIP_CONFIG } from 'components/Toucan/Auction/BidDistributionChart/constants'
import { formatTickForDisplay } from 'components/Toucan/Auction/BidDistributionChart/utils/utils'
import { BidTokenInfo, DisplayMode } from 'components/Toucan/Auction/store/types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { zIndexes } from 'ui/src/theme'

interface UseChartTooltipParams {
  displayMode: DisplayMode
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  formatter: (amount: number) => string
  volumeFormatter: (amount: number) => string
  colors: UseSporeColorsReturn
}

/**
 * Manages tooltip style + text that shows when user hovers over chart bar
 */
export function useChartTooltip(params: UseChartTooltipParams) {
  const { displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals, formatter, volumeFormatter, colors } = params
  const { t } = useTranslation()

  const fdvText = t('stats.fdv')

  const createTooltipElement = useCallback((): HTMLDivElement => {
    const tooltip = document.createElement('div')
    Object.assign(tooltip.style, {
      position: 'absolute',
      pointerEvents: 'none',
      background: colors.surface2.val,
      color: colors.neutral1.val,
      zIndex: String(zIndexes.tooltip),
      fontSize: `${TOOLTIP_CONFIG.FONT_SIZE}px`,
      padding: TOOLTIP_CONFIG.PADDING,
      borderRadius: TOOLTIP_CONFIG.BORDER_RADIUS,
      transform: `translate(-50%, -${TOOLTIP_CONFIG.VERTICAL_OFFSET_PERCENT}%)`,
      whiteSpace: 'nowrap',
      display: 'none',
    })
    return tooltip
  }, [colors.neutral1.val, colors.surface2.val])

  /**
   * Formats tooltip text based on display mode, tick value, and volume amount
   */
  const formatTooltipText = useCallback(
    (tickValue: number, volumeAmount: number): string => {
      const tickDisplay = formatTickForDisplay({
        tickValue,
        displayMode,
        bidTokenInfo,
        totalSupply,
        auctionTokenDecimals,
        formatter,
      })

      // Handle zero values explicitly to show "0" instead of "-"
      const volumeDisplay = volumeAmount === 0 ? '0' : volumeFormatter(volumeAmount)

      // Add "FDV" suffix when in valuation mode
      const suffix = displayMode === DisplayMode.VALUATION ? ` ${fdvText}` : ''

      return `${volumeDisplay} @ ${tickDisplay}${suffix}`
    },
    [displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals, formatter, volumeFormatter, fdvText],
  )

  return { createTooltipElement, formatTooltipText }
}
