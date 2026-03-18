import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { OrderDirection } from '~/appGraphql/data/util'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/styled'
import { HEADER_DESCRIPTIONS, TokenSortMethod } from '~/components/Tokens/constants'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useTokenTableSortStoreActions } from '~/pages/Explore/tables/Tokens/tokenTableSortStore'

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
  const headerText = useMemo(() => getHeaderText({ t, category }), [t, category])
  const { setSort } = useTokenTableSortStoreActions()
  const handleSortCategory = useCallback(() => setSort(category), [setSort, category])

  return (
    <ClickableHeaderRow onPress={handleSortCategory} group>
      <MouseoverTooltip
        disabled={!HEADER_DESCRIPTIONS[category]}
        size={TooltipSize.Small}
        text={HEADER_DESCRIPTIONS[category]}
        placement="top"
      >
        <Flex row gap="$gap4" alignItems="center">
          {isCurrentSortMethod && <HeaderArrow orderDirection={direction} size="$icon.16" />}
          <HeaderSortText active={isCurrentSortMethod} variant="body3">
            {headerText}
          </HeaderSortText>
        </Flex>
      </MouseoverTooltip>
    </ClickableHeaderRow>
  )
}
