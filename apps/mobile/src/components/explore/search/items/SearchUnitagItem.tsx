import React from 'react'
import { SearchWalletItemBase } from 'src/components/explore/search/items/SearchWalletItemBase'
import { Flex, Text } from 'ui/src'
import { imageSizes } from 'ui/src/theme'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { sanitizeAddressText, shortenAddress } from 'uniswap/src/utils/addresses'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { UnitagSearchResult } from 'wallet/src/features/search/SearchResult'
import { useAvatar } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

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
      <Flex row alignItems="center" gap="$spacing12" px="$spacing24" py="$spacing12">
        <AccountIcon address={address} avatarUri={avatar} size={imageSizes.image40} />
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
