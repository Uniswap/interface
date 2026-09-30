import { Flex } from '@universe/mycelium'
import { memo } from 'react'
import {
  OnchainItemListOptionType,
  SearchModalListOption,
  SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { HorizontalFadeScroll } from 'uniswap/src/components/TokenSelectorV2/HorizontalFadeScroll'
import { RECENT_SEARCH_PILLS_MAX_COUNT } from 'uniswap/src/features/search/SearchModal/constants'
import type {
  OnSelectSearchModalOption,
  SearchModalOptionSelection,
} from 'uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection'
import { PILL_ROW_PADDING_BOTTOM, PillPressProps } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/Pill'
import { PoolPill } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/PoolPill'
import { TokenPill } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/TokenPill'
import { WalletPill } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/WalletPill'
import { searchModalOptionKey } from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'

interface RecentSearchPillsProps {
  options: SearchModalOption[]
  section: OnchainItemSection<SearchModalListOption>
  rowIndex: number
  onSelectOption: OnSelectSearchModalOption
  getModifierPressHref?: (item: SearchModalOption) => string | undefined
  onModifierPress?: OnSelectSearchModalOption
}

/**
 * Search V2 recents as one horizontally scrolling pill row (Figma 1086:13875). Replaces the vertical
 * recent rows so more recents fit above the fold; presses go through the same select path as rows.
 */
export const RecentSearchPills = memo(function RecentSearchPills({
  options,
  section,
  rowIndex,
  onSelectOption,
  getModifierPressHref,
  onModifierPress,
}: RecentSearchPillsProps): JSX.Element | null {
  const visibleOptions = options.slice(0, RECENT_SEARCH_PILLS_MAX_COUNT)

  if (visibleOptions.length === 0) {
    return null
  }

  return (
    <HorizontalFadeScroll>
      <Flex row gap="$spacing8" pl="$spacing20" pr="$spacing12" pt="$spacing4" pb={PILL_ROW_PADDING_BOTTOM}>
        {visibleOptions.map((option, index) => {
          const selection: SearchModalOptionSelection = { item: option, section, index, rowIndex }
          return (
            <RecentSearchPill
              key={searchModalOptionKey(option)}
              modifierPressHref={getModifierPressHref?.(option)}
              option={option}
              onModifierPress={onModifierPress ? (): void => onModifierPress(selection) : undefined}
              onPress={(): void => onSelectOption(selection)}
            />
          )
        })}
      </Flex>
    </HorizontalFadeScroll>
  )
})

function RecentSearchPill({
  option,
  ...pressProps
}: PillPressProps & { option: SearchModalOption }): JSX.Element | null {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return <TokenPill currencyInfo={option.currencyInfo} {...pressProps} />
    case OnchainItemListOptionType.MultichainToken:
      return (
        <TokenPill
          currencyInfo={option.primaryCurrencyInfo}
          networkCount={option.multichainResult.tokens.length}
          {...pressProps}
        />
      )
    case OnchainItemListOptionType.Pool:
      return <PoolPill option={option} {...pressProps} />
    case OnchainItemListOptionType.WalletByAddress:
      return <WalletPill address={option.address} {...pressProps} />
    case OnchainItemListOptionType.ENSAddress:
      return <WalletPill address={option.address} label={option.ensName} {...pressProps} />
    case OnchainItemListOptionType.Unitag:
      return <WalletPill address={option.address} label={option.unitag} {...pressProps} />
    default:
      // Collections, vaults and auctions are never written to search history.
      return null
  }
}
