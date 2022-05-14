import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import HomeIcon from 'src/assets/icons/home.svg'
import SearchIcon from 'src/assets/icons/search.svg'
import StackedIcon from 'src/assets/icons/stacked.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'

interface NavIconProps {
  focused: boolean
}

export function HomeTabIcon({ focused }: NavIconProps) {
  const theme = useAppTheme()

  return (
    <HomeIcon
      color={theme.colors.deprecated_textColor}
      height={24}
      opacity={focused ? 1 : 0.6}
      width={24}
    />
  )
}

export function WalletTabIcon({ focused }: NavIconProps) {
  const theme = useAppTheme()

  return (
    <WalletIcon
      color={theme.colors.deprecated_textColor}
      height={24}
      opacity={focused ? 1 : 0.6}
      width={24}
    />
  )
}

export function ExploreTabIcon({ focused }: NavIconProps) {
  const theme = useAppTheme()

  return (
    <SearchIcon
      color={theme.colors.deprecated_textColor}
      opacity={focused ? 1 : 0.6}
      strokeWidth={2}
    />
  )
}

export function NFTTabIcon({ focused }: NavIconProps) {
  const theme = useAppTheme()

  return (
    <StackedIcon
      color={theme.colors.deprecated_textColor}
      opacity={focused ? 1 : 0.6}
      strokeWidth={2}
    />
  )
}
