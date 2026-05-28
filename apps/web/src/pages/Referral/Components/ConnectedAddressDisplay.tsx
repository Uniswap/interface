/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */

import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import StatusIcon from 'components/Identicon/StatusIcon'
import { useAccount } from 'hooks/useAccount'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useENSName } from 'uniswap/src/features/ens/api'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { shortenAddress } from 'utilities/src/addresses'

interface ConnectedAddressDisplayProps {
  isCompact: boolean
}

export function ConnectedAddressDisplay({ isCompact }: ConnectedAddressDisplayProps) {
  const account = useAccount()
  const { address } = account
  const { data: ENSName } = useENSName(address)
  const { unitag } = useUnitagByAddress(address)
  const showAddress = (ENSName || unitag?.username) && !isCompact

  if (!address) {
    return null
  }

  const iconSize = isCompact ? iconSizes.icon24 : iconSizes.icon48

  return (
    <Flex row alignItems="center" gap="$spacing12" shrink>
      <StatusIcon address={address} size={iconSize} showMiniIcons={false} />
      <Flex gap="$spacing4">
        <Text variant="subheading1" color="$neutral1">
          <AddressDisplay enableCopyAddress={!showAddress} address={address} />
        </Text>
        {showAddress && (
          <CopyHelper iconSize={14} iconPosition="right" toCopy={address}>
            <Text variant="body3" color="neutral3">
              {shortenAddress(address)}
            </Text>
          </CopyHelper>
        )}
      </Flex>
    </Flex>
  )
}
