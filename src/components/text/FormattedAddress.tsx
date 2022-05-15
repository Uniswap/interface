import React from 'react'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'

type FormattedAddressProps = {
  name?: string | null
  address: string
} & { variant?: keyof Theme['textVariants'] }

export function FormattedAddress({ name, address, variant = 'body1' }: FormattedAddressProps) {
  return <Text variant={variant}>{name ?? shortenAddress(address)}</Text>
}
