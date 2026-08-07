import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { getHeaderDescription, TokenSortMethod } from '~/components/Tokens/constants'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { OrderDirection } from '~/data/util'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'
import { useExploreParams } from '~/pages/Explore/redirects'
import { useTokenTableSortStoreActions } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

type TokenSortMethodWithLookupLabel = Exclude<
  TokenSortMethod,
  TokenSortMethod.VOLUME | TokenSortMethod.HOUR_CHANGE | TokenSortMethod.DAY_CHANGE
>

const SORT_METHOD_LABEL_KEYS: Record<TokenSortMethodWithLookupLabel, string> = {
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: 'stats.fdv',
  [TokenSortMethod.PRICE]: 'common.price',
}

export function getTokenSortMethodLabel({
  t,
  category,
}: {
  t: (key: string) => string
  category: TokenSortMethod
}): string {
  if (category === TokenSortMethod.VOLUME) {
    return t('common.volume')
  }
  // Keep this literal t() call so i18n extraction preserves common.oneDay.short.
  if (category === TokenSortMethod.DAY_CHANGE) {
    return t('common.oneDay.short')
  }
  // Keep this literal t() call so i18n extraction preserves common.oneHour.short.
  if (category === TokenSortMethod.HOUR_CHANGE) {
    return t('common.oneHour.short')
  }

  return t(SORT_METHOD_LABEL_KEYS[category])
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
  const headerText = useMemo(() => getTokenSortMethodLabel({ t, category }), [t, category])
  const { setSort } = useTokenTableSortStoreActions()
  const handleSortCategory = useCallback(() => {
    const newSortAscending = setSort(category)
    sendAnalyticsEvent(InterfaceEventName.ExploreTableSorted, {
      table_type: 'tokens',
      sort_method: category,
      sort_direction: newSortAscending ? OrderDirection.Asc : OrderDirection.Desc,
      surface: 'explore',
    })
    scrollToExploreTokenSection()
  }, [setSort, category])

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
