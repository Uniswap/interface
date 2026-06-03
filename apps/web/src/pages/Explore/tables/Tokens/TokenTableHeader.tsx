import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { OrderDirection } from '~/appGraphql/data/util'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { getHeaderDescription, TokenSortMethod } from '~/components/Tokens/constants'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useExploreParams } from '~/pages/Explore/redirects'
import { useTokenTableSortStoreActions } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

function getHeaderText({ t, category }: { t: (key: string) => string; category: TokenSortMethod }): string {
  const SORT_METHOD_LABEL_KEYS: Record<TokenSortMethod, string> = {
    [TokenSortMethod.FULLY_DILUTED_VALUATION]: t('stats.fdv'),
    [TokenSortMethod.PRICE]: t('common.price'),
    [TokenSortMethod.VOLUME]: t('common.volume'),
    [TokenSortMethod.HOUR_CHANGE]: t('common.oneHour.short'),
    [TokenSortMethod.DAY_CHANGE]: t('common.oneDay.short'),
  }
  return SORT_METHOD_LABEL_KEYS[category]
}

export function TokenTableHeader({
  category,
  isCurrentSortMethod,
  direction,
}: {
  category: TokenSortMethod
  isCurrentSortMethod: boolean
  direction: OrderDirection
}) {
  const { t } = useTranslation()
  const { chainName } = useExploreParams()
  const headerText = useMemo(() => getHeaderText({ t, category }), [t, category])
  const { setSort } = useTokenTableSortStoreActions()
  const handleSortCategory = useCallback(() => setSort(category), [setSort, category])

  const networkName = useMemo(() => {
    if (category !== TokenSortMethod.PRICE || !chainName) {
      return undefined
    }
    const chainId = getChainIdFromChainUrlParam(chainName)
    return chainId ? getChainInfo(chainId).name : undefined
  }, [category, chainName])
  const tooltipContent = useMemo(() => getHeaderDescription({ t, category, networkName }), [t, category, networkName])

  return (
    <ClickableHeaderRow onPress={handleSortCategory} width="100%" group>
      <MouseoverTooltip
        disabled={!tooltipContent}
        size={TooltipSize.Small}
        text={tooltipContent}
        placement="top"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex row gap="$gap4" alignItems="center" cursor="pointer">
          {isCurrentSortMethod && <HeaderArrow orderDirection={direction} size="$icon.16" />}
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {headerText}
          </HeaderSortText>
        </Flex>
      </MouseoverTooltip>
    </ClickableHeaderRow>
  )
}
