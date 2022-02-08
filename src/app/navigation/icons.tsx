import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs'
import React, { PropsWithChildren } from 'react'
import { useAppTheme } from 'src/app/hooks'
import SearchIcon from 'src/assets/icons/search.svg'
import SwapIcon from 'src/assets/icons/swap.svg'
import WalletIcon from 'src/assets/icons/wallet.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { EmptyCircle } from 'src/components/icons/EmptyCircle'
import { Flex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'

export function SwapButton(props: BottomTabBarButtonProps) {
  return (
    <IconButton
      icon={<SwapIcon fill="white" height={24} width={24} />}
      mb="sm"
      name={ElementName.TabBarSwap}
      testID={ElementName.TabBarSwap}
      variant="primary"
      onPress={props.onPress}
    />
  )
}

interface NavIconProps {
  focused: boolean
}

export function WalletTabIcon({ focused }: NavIconProps) {
  const primaryColor = useTabNavColors()
  return (
    <WithDot focused={focused}>
      <WalletIcon fill={primaryColor} opacity={focused ? 1 : 0.3} />
    </WithDot>
  )
}

export function ExploreTabIcon({ focused }: NavIconProps) {
  const primaryColor = useTabNavColors()
  return (
    <WithDot focused={focused}>
      <SearchIcon opacity={focused ? 1 : 0.3} stroke={primaryColor} strokeWidth={2.2} />
    </WithDot>
  )
}

function WithDot({ children, focused }: PropsWithChildren<NavIconProps>) {
  return (
    <Flex alignItems="center" gap="xs">
      {/* this is kind of a hack but im rendering a dot above and below so that
        the main icon stays centered within the navbar even when there is a dot below it
      */}
      <EmptyCircle backgroundColor="none" borderWidth={0} size={4} />
      {children}
      <EmptyCircle backgroundColor={focused ? 'primary1' : 'none'} borderWidth={0} size={4} />
    </Flex>
  )
}

function useTabNavColors() {
  const theme = useAppTheme()
  const primaryColor = theme.colors.primary1
  return primaryColor
}
