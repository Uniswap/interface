import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'
import { isValidAddress } from 'src/utils/addresses'

type Props = {
  address: Address
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

// Just shows a solid color for now
export function Identicon({ address, size = 36, ...rest }: Props) {
  if (!isValidAddress(address)) throw new Error(`Invalid address for identicon ${address}`)
  const color = useAddressColor(address)
  return <Box backgroundColor={color} borderRadius="full" height={size} width={size} {...rest} />
}

function useAddressColor(address: string): keyof Theme['colors'] {
  const colorSeed = parseInt(address.at(-1)!, 16)
  if (colorSeed < 4) return 'blue'
  if (colorSeed < 8) return 'green'
  if (colorSeed < 12) return 'red'
  return 'yellow'
}
