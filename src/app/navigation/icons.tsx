import { useTheme } from '@shopify/restyle'
import React from 'react'
import SearchIcon from 'src/assets/icons/search.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { Theme } from 'src/styles/theme'

interface NavIconProps {
  focused: boolean
}

export function WalletTabIcon({ focused }: NavIconProps) {
  const theme = useTheme<Theme>()

  return (
    <WalletIcon fill={theme.colors.textColor} height={24} opacity={focused ? 1 : 0.6} width={24} />
  )
}

export function ExploreTabIcon({ focused }: NavIconProps) {
  const theme = useTheme<Theme>()

  return <SearchIcon opacity={focused ? 1 : 0.6} stroke={theme.colors.textColor} strokeWidth={2} />
}
