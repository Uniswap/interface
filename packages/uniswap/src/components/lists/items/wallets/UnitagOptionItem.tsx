import { Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import { UnitagOption } from 'uniswap/src/components/lists/items/types'
import { WalletBaseOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletBaseOptionItem'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { UnitagName } from 'uniswap/src/features/unitags/UnitagName'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'

type UnitagOptionItemProps = {
  unitagOption: UnitagOption
  onPress: OptionItemProps['onPress']
}

export function UnitagOptionItem({ unitagOption, onPress }: UnitagOptionItemProps): JSX.Element {
  const { address, unitag } = unitagOption
  const { avatar } = useAvatar(address)

  return (
    <WalletBaseOptionItem
      option={unitagOption}
      image={<AccountIcon address={address} avatarUri={avatar} size={iconSizes.icon40} />}
      title={
        <UnitagName
          displayUnitagSuffix
          displayIconInline
          name={unitag}
          textProps={{ variant: 'body1', lineHeight: undefined }}
        />
      }
      subtitle={
        <Text color="$neutral2" variant="body2">
          {sanitizeAddressText(shortenAddress(address))}
        </Text>
      }
      onPress={onPress}
    />
  )
}
