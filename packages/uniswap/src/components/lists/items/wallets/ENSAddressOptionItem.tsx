import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import { ENSAddressOption } from 'uniswap/src/components/lists/items/types'
import { WalletBaseOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletBaseOptionItem'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useENSName } from 'uniswap/src/features/ens/api'
import { getCompletedENSName } from 'uniswap/src/features/ens/useENS'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'

type ENSAddressOptionItemProps = {
  ensAddressOption: ENSAddressOption
  onPress: OptionItemProps['onPress']
}

export function ENSAddressOptionItem({ ensAddressOption, onPress }: ENSAddressOptionItemProps): JSX.Element {
  const { t } = useTranslation()

  // Use `savedPrimaryEnsName` for WalletSearchResults that are stored in the search history
  // so that we don't have to do an additional ENS fetch when loading search history
  const { address, ensName, primaryENSName: savedPrimaryENSName, isRawName } = ensAddressOption
  const formattedAddress = sanitizeAddressText(shortenAddress({ address }))

  // Get the completed name if it's not a raw name
  const completedENSName = isRawName ? ensName : getCompletedENSName(ensName)

  /*
   * Fetch primary ENS associated with `address` since it may resolve to an
   * ENS different than the `ensName` searched
   * ex. if searching `uni.eth` resolves to 0x123, and the primary ENS for 0x123
   * is `uniswap.eth`, then we should show "uni.eth | owned by uniswap.eth"
   */
  const { data: fetchedPrimaryENSName, isLoading: isFetchingPrimaryENSName } = useENSName(
    savedPrimaryENSName ? undefined : address,
  )

  const primaryENSName = savedPrimaryENSName ?? fetchedPrimaryENSName
  const isPrimaryENSName = completedENSName === primaryENSName

  const showOwnedBy = !isFetchingPrimaryENSName && !isPrimaryENSName
  const showAddress = !showOwnedBy

  return (
    <WalletBaseOptionItem
      option={ensAddressOption}
      image={<AccountIcon address={address} size={iconSizes.icon40} />}
      title={(completedENSName || formattedAddress) ?? ''}
      subtitle={
        <Text color="$neutral2" ellipsizeMode="tail" numberOfLines={1} variant="subheading2">
          {showOwnedBy &&
            t('explore.search.label.ownedBy', {
              ownerAddress: primaryENSName || formattedAddress,
            })}
          {showAddress && formattedAddress}
        </Text>
      }
      onPress={onPress}
    />
  )
}
