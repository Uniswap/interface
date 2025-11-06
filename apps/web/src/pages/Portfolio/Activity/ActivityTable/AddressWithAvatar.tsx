import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useENSName } from 'uniswap/src/features/ens/api'
import { shortenAddress } from 'utilities/src/addresses'

interface AddressWithAvatarProps {
  address: Address
  size?: number
  showAvatar?: boolean
}

export function AddressWithAvatar({ address, size = 20, showAvatar = true }: AddressWithAvatarProps) {
  const { data: ENSName } = useENSName(address)
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const uniswapUsername = unitag?.username

  const displayName = uniswapUsername ?? ENSName ?? shortenAddress({ address })
  const hasUnitag = Boolean(uniswapUsername)

  return (
    <Flex row alignItems="center" gap="$gap8">
      {showAvatar && (
        <AccountIcon
          address={address}
          size={size}
          showBackground={true}
          showBorder={true}
          borderColor="$surface3"
          borderWidth="$spacing1"
        />
      )}
      <Text variant="body3" color="$neutral1">
        {displayName}
      </Text>
      {hasUnitag && <Unitag size={16} />}
    </Flex>
  )
}
