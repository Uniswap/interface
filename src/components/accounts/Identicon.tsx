import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { useColorScheme } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box } from 'src/components/layout/Box'
import { selectUserLocalPfp } from 'src/features/wallet/walletSlice'
import { colorsDark, colorsLight } from 'src/styles/color'
import { theme, Theme } from 'src/styles/theme'
import { isValidAddress } from 'src/utils/addresses'

type Props = {
  address: Address
  size?: number
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function Identicon({ address, size = 36, ...rest }: Props) {
  if (!isValidAddress(address)) throw new Error(`Invalid address for identicon ${address}`)
  const isDarkMode = useColorScheme() === 'dark'

  const color = useAddressColor(address, isDarkMode)
  const userPfp = useAppSelector(selectUserLocalPfp)

  return (
    <Box
      borderRadius="full"
      height={size}
      style={{ backgroundColor: color }}
      width={size}
      {...rest}>
      {userPfp && (
        <RemoteImage
          borderRadius={theme.borderRadii.full}
          height={size}
          imageUrl={userPfp}
          width={size}
        />
      )}
    </Box>
  )
}

export function useAddressColor(address: string, isDarkMode: boolean, offset = 1) {
  const palette = isDarkMode ? colorsDark : colorsLight
  const colorSeed = parseInt(address.at(-offset)!, 16)
  if (colorSeed < 3) return palette.orange
  if (colorSeed < 6) return palette.green
  if (colorSeed < 9) return palette.pink
  if (colorSeed < 12) return palette.blue
  return palette.red
}
