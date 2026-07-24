import { type MouseEvent, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useExploreParams } from '~/pages/Explore/redirects'
import { getExpandableAssetHeaderDescription } from '~/pages/Explore/rwa/table/expandableAssetTableHeaderUtils'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

export function ExpandableAssetMetricHeaderTooltip({
  category,
  children,
  onTooltipClick,
}: {
  category: StocksSortMethod
  children: JSX.Element
  onTooltipClick?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { chainName } = useExploreParams()

  const networkName = useMemo(() => {
    if (category !== StocksSortMethod.PRICE || !chainName) {
      return undefined
    }
    const chainId = getChainIdFromChainUrlParam(chainName)
    return chainId ? getChainInfo(chainId).name : undefined
  }, [category, chainName])

  const tooltipContent = useMemo(
    () => getExpandableAssetHeaderDescription({ t, category, networkName }),
    [t, category, networkName],
  )

  const handleTooltipClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      onTooltipClick?.()
    },
    [onTooltipClick],
  )

  return (
    <MouseoverTooltip
      disabled={!tooltipContent}
      size={TooltipSize.Small}
      text={tooltipContent}
      placement="top"
      onClick={handleTooltipClick}
    >
      {children}
    </MouseoverTooltip>
  )
}
