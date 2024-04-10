import React from 'react'
import { SearchWalletItemBase } from 'src/components/explore/search/items/SearchWalletItemBase'
import { Flex } from 'ui/src'
import { imageSizes } from 'ui/src/theme'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { UnitagSearchResult } from 'wallet/src/features/search/SearchResult'
import { useAvatar } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type SearchUnitagItemProps = {
  searchResult: UnitagSearchResult
  searchContext?: SearchContext
}

export function SearchUnitagItem({
  searchResult,
  searchContext,
}: SearchUnitagItemProps): JSX.Element {
  const { address, unitag } = searchResult
  const { avatar } = useAvatar(address)

  const displayName = { name: unitag, type: DisplayNameType.Unitag }

  return (
    <SearchWalletItemBase searchContext={searchContext} searchResult={searchResult}>
      <Flex row alignItems="center" gap="$spacing12" px="$spacing8" py="$spacing12">
        <AccountIcon address={address} avatarUri={avatar} size={imageSizes.image40} />
        <DisplayNameText displayName={displayName} textProps={{ variant: 'body1' }} />
      </Flex>
    </SearchWalletItemBase>
  )
}
