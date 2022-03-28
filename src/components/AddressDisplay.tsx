import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENSName } from 'src/features/ens/useENSName'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

type AddressDisplayProps = {
  address?: string
  alwaysShowAddress?: boolean
  displayName?: string
  fallback?: string
  override?: string
  size?: number
  variant?: keyof Theme['textVariants']
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  fallback,
  override,
  size = 24,
  variant = 'body',
  alwaysShowAddress,
}: AddressDisplayProps) {
  const displayName = useDisplayName(address, override, fallback)

  if (!address || !displayName) {
    return null
  }

  return (
    <Flex centered row gap="sm">
      <Identicon address={address} size={size} />
      <Flex gap="xs">
        <Text color="textColor" variant={variant}>
          {displayName}
        </Text>
        {alwaysShowAddress && (
          <Text color="gray600" variant="bodySm">
            {shortenAddress(address)}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

function useDisplayName(address?: string, nameOverride?: string, fallback?: string) {
  const ens = useENSName(ChainId.Mainnet, address)

  return nameOverride ?? ens.ENSName ?? (address ? shortenAddress(address) : fallback)
}
