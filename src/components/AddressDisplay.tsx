import React from 'react'
import { Identicon } from 'src/components/accounts/Identicon'
import { IdenticonWithNotificationBadge } from 'src/components/accounts/IdenticonWithNotificationBadge'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { useAccounts } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

type AddressDisplayProps = {
  address?: string
  alwaysShowAddress?: boolean
  displayName?: string
  fallback?: string
  size?: number
  variant?: keyof Theme['textVariants']
  verticalGap?: keyof Theme['spacing']
  showNotificationBadge?: boolean
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  fallback,
  size = 24,
  variant = 'body1',
  verticalGap = 'xxs',
  alwaysShowAddress,
  showNotificationBadge,
}: AddressDisplayProps) {
  const { name, address: validatedAddress } = useDisplayName(address, fallback)

  if (!validatedAddress || !name) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="sm">
      {showNotificationBadge ? (
        <IdenticonWithNotificationBadge address={validatedAddress} size={size} />
      ) : (
        <Identicon address={validatedAddress} size={size} />
      )}
      <Flex gap={verticalGap}>
        <Text
          color="deprecated_textColor"
          testID={`address-display/name/${name}`}
          variant={variant}>
          {name}
        </Text>
        {alwaysShowAddress && (
          <Text color="deprecated_gray600" variant="caption">
            {shortenAddress(validatedAddress)}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

export function useDisplayName(address?: string, fallback?: string) {
  const ens = useENS(ChainId.Mainnet, address)

  // if address is a local account with a name
  const maybeLocalName = useAccounts()[address ?? '']?.name

  return {
    name: maybeLocalName ?? ens.name ?? (ens.address ? shortenAddress(ens.address) : fallback),
    address: ens.address,
  }
}
