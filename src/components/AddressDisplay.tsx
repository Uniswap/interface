import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
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
  verticalGap?: keyof Theme['spacing']
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  fallback,
  override,
  size = 24,
  variant = 'body',
  verticalGap = 'xxs',
  alwaysShowAddress,
}: AddressDisplayProps) {
  const { name, address: validatedAddress } = useDisplayName(address, override, fallback)

  if (!validatedAddress || !name) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="sm">
      <Identicon address={validatedAddress} size={size} />
      <Flex gap={verticalGap}>
        <Text color="textColor" testID={`address-display/name/${name}`} variant={variant}>
          {name}
        </Text>
        {alwaysShowAddress && (
          <Text color="gray600" variant="bodySm">
            {shortenAddress(validatedAddress)}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

function useDisplayName(address?: string, nameOverride?: string, fallback?: string) {
  const ens = useENS(ChainId.Mainnet, address)

  return {
    name: nameOverride ?? ens.name ?? (ens.address ? shortenAddress(ens.address) : fallback),
    address: ens.address,
  }
}
