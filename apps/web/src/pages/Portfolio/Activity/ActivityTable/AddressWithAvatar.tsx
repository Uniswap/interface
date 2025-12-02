import { useActivityAddressLookupValue } from 'pages/Portfolio/Activity/ActivityTable/ActivityAddressLookupStore'
import { memo } from 'react'
import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { iconSizes } from 'ui/src/theme'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useENSName } from 'uniswap/src/features/ens/api'
import { shortenAddress } from 'utilities/src/addresses'

interface AddressWithAvatarProps {
  address: Address
  showAvatar?: boolean
}

function _AddressWithAvatar({ address, showAvatar = true }: AddressWithAvatarProps) {
  // Try to get Unitag from store first (batch fetched)
  const { unitagsMap } = useActivityAddressLookupValue()
  const contextUnitag = unitagsMap.get(address)

  // Fallback to individual query if not in context (for addresses outside the table)
  const { data: unitag } = useUnitagsAddressQuery({
    params: address && !contextUnitag ? { address } : undefined,
  })

  // ENS lookups are handled individually - React Query will deduplicate
  const { data: ENSName } = useENSName(address)

  // Use context Unitag if available, otherwise fallback to individual query result
  const uniswapUsername = contextUnitag ?? unitag?.username

  const displayName = uniswapUsername ?? ENSName ?? shortenAddress({ address })
  const hasUnitag = Boolean(uniswapUsername)

  return (
    <Flex row alignItems="center" gap="$gap8">
      {showAvatar && <AccountIcon address={address} size={iconSizes.icon16} />}
      <Text variant="body3" color="$neutral1">
        {displayName}
      </Text>
      {hasUnitag && <Unitag size={16} />}
    </Flex>
  )
}

export const AddressWithAvatar = memo(_AddressWithAvatar)
