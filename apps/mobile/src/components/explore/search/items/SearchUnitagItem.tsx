import React from 'react'
import { SEARCH_ITEM_ICON_SIZE, SEARCH_ITEM_PX, SEARCH_ITEM_PY } from 'src/components/explore/search/constants'
import { SearchWalletItemBase } from 'src/components/explore/search/items/SearchWalletItemBase'
import { Flex, Text } from 'ui/src'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { SearchContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { UnitagSearchResult } from 'uniswap/src/features/search/SearchResult'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'

type SearchUnitagItemProps = {
  searchResult: UnitagSearchResult
  searchContext?: SearchContext
}

export function SearchUnitagItem({ searchResult, searchContext }: SearchUnitagItemProps): JSX.Element {
  const { address, unitag } = searchResult
  const { avatar } = useAvatar(address)

  const displayName = { name: unitag, type: DisplayNameType.Unitag }

  return (
    <SearchWalletItemBase searchContext={searchContext} searchResult={searchResult}>
      <Flex row alignItems="center" gap="$spacing12" px={SEARCH_ITEM_PX} py={SEARCH_ITEM_PY}>
        <AccountIcon address={address} avatarUri={avatar} size={SEARCH_ITEM_ICON_SIZE} />
        <Flex alignItems="flex-start" justifyContent="center">
          <DisplayNameText includeUnitagSuffix displayName={displayName} textProps={{ variant: 'body1' }} />
          <Text color="$neutral2" variant="body2">
            {sanitizeAddressText(shortenAddress(address))}
          </Text>
        </Flex>
      </Flex>
    </SearchWalletItemBase>
  )
}
