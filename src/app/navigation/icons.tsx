import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import { useTheme } from '@shopify/restyle'
import React from 'react'
import SearchIcon from 'src/assets/icons/search.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { Theme } from 'src/styles/theme'

export function SwapButton(props: BottomTabBarButtonProps) {
  return (
    <IconButton
      mb="sm"
      variant={'primary'}
      onPress={props.onPress}
      icon={<SwapIcon height={24} width={24} fill="white" />}
    />
  )
}

interface NavIconProps {
  focused: boolean
}

export function WalletTabIcon({ focused }: NavIconProps) {
  const { primaryColor, secondaryColor } = useTabNavColors()
  return <WalletIcon height={30} width={30} fill={focused ? primaryColor : secondaryColor} />
}

export function ExploreTabIcon({ focused }: NavIconProps) {
  const { primaryColor, secondaryColor } = useTabNavColors()
  return (
    <SearchIcon
      height={30}
      width={30}
      stroke={focused ? primaryColor : secondaryColor}
      strokeWidth={2.2}
    />
  )
}

function useTabNavColors() {
  const theme = useTheme<Theme>()
  const primaryColor = theme.colors.primary1
  const secondaryColor = theme.colors.black
  return { primaryColor, secondaryColor }
}
