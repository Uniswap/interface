import React from 'react'
import { useTranslation } from 'react-i18next'
import { SearchWalletItemBase } from 'src/components/explore/search/items/SearchWalletItemBase'
import { Flex, Text } from 'ui/src'
import { imageSizes } from 'ui/src/theme'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { useENSAvatar, useENSName } from 'wallet/src/features/ens/api'
import { getCompletedENSName } from 'wallet/src/features/ens/useENS'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { ENSAddressSearchResult } from 'wallet/src/features/search/SearchResult'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

type SearchENSAddressItemProps = {
  searchResult: ENSAddressSearchResult
  searchContext?: SearchContext
}

export function SearchENSAddressItem({
  searchResult,
  searchContext,
}: SearchENSAddressItemProps): JSX.Element {
  const { t } = useTranslation()

  // Use `savedPrimaryEnsName` for WalletSearchResults that are stored in the search history
  // so that we don't have to do an additional ENS fetch when loading search history
  const { address, ensName, primaryENSName: savedPrimaryENSName, isRawName } = searchResult
  const formattedAddress = sanitizeAddressText(shortenAddress(address))

  // Get the completed name if it's not a raw name
  const completedENSName = isRawName ? ensName : getCompletedENSName(ensName ?? null)

  /*
   * Fetch primary ENS associated with `address` since it may resolve to an
   * ENS different than the `ensName` searched
   * ex. if searching `uni.eth` resolves to 0x123, and the primary ENS for 0x123
   * is `uniswap.eth`, then we should show "uni.eth | owned by uniswap.eth"
   */
  const { data: fetchedPrimaryENSName, loading: isFetchingPrimaryENSName } = useENSName(
    savedPrimaryENSName ? undefined : address
  )

  const primaryENSName = savedPrimaryENSName ?? fetchedPrimaryENSName
  const isPrimaryENSName = completedENSName === primaryENSName

  const showAddress = searchResult.isRawName
  const showOwnedBy = !isFetchingPrimaryENSName && !isPrimaryENSName && !showAddress
  const showSecondLine = showAddress || showOwnedBy

  const { data: avatar } = useENSAvatar(address)

  return (
    <SearchWalletItemBase searchContext={searchContext} searchResult={searchResult}>
      <Flex row alignItems="center" gap="$spacing12" px="$spacing8" py="$spacing12">
        <AccountIcon address={address} avatarUri={avatar} size={imageSizes.image40} />
        <Flex shrink>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            testID={`address-display/name/${ensName}`}
            variant="body1">
            {completedENSName || formattedAddress}
          </Text>
          {showSecondLine ? (
            <Text color="$neutral2" ellipsizeMode="tail" numberOfLines={1} variant="subheading2">
              {showOwnedBy &&
                t('explore.search.label.ownedBy', {
                  ownerAddress: primaryENSName || formattedAddress,
                })}
              {showAddress && formattedAddress}
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </SearchWalletItemBase>
  )
}
