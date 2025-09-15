import { iconSizes } from 'ui/src/theme'
import { OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import {
  ENSAddressOption,
  OnchainItemListOptionType,
  UnitagOption,
  WalletByAddressOption,
} from 'uniswap/src/components/lists/items/types'
import { ENSAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/ENSAddressOptionItem'
import { UnitagOptionItem } from 'uniswap/src/components/lists/items/wallets/UnitagOptionItem'
import { WalletBaseOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletBaseOptionItem'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'

type WalletByAddressOptionItemProps = {
  walletByAddressOption: WalletByAddressOption
  onPress: OptionItemProps['onPress']
}

export function WalletByAddressOptionItem({
  walletByAddressOption,
  onPress,
}: WalletByAddressOptionItemProps): JSX.Element {
  const { address } = walletByAddressOption

  // Since we only save address in search history, we should check if the associated wallet actually has an ENS/Unitag name, and display accordingly
  const displayName = useOnchainDisplayName(address)
  if (displayName?.type === DisplayNameType.Unitag) {
    const unitagOption: UnitagOption = {
      type: OnchainItemListOptionType.Unitag,
      address,
      unitag: displayName.name,
    }
    return <UnitagOptionItem unitagOption={unitagOption} onPress={onPress} />
  } else if (displayName?.type === DisplayNameType.ENS) {
    const ensAddressOption: ENSAddressOption = {
      type: OnchainItemListOptionType.ENSAddress,
      address,
      ensName: displayName.name,
      isRawName: !displayName.name.endsWith(ENS_SUFFIX), // Ensure raw name is used for subdomains only
    }
    return <ENSAddressOptionItem ensAddressOption={ensAddressOption} onPress={onPress} />
  }

  return (
    <WalletBaseOptionItem
      option={walletByAddressOption}
      image={<AccountIcon address={address} size={iconSizes.icon40} />}
      title={displayName?.name ?? ''}
      onPress={onPress}
    />
  )
}
