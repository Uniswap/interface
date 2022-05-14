import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { impactAsync, notificationAsync } from 'expo-haptics'
import React from 'react'
import { useColorScheme } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { ExploreTabIcon, HomeTabIcon, NFTTabIcon, WalletTabIcon } from 'src/app/navigation/icons'
import SwapIcon from 'src/assets/icons/swap.svg'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { Box } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens, Tabs } from 'src/screens/Screens'

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'
  const SwapTabIcon = (
    <SwapIcon
      color={isDarkMode ? theme.colors.white : theme.colors.deprecated_primary1}
      height={20}
      width={20}
    />
  )

  return (
    <Box backgroundColor="deprecated_background1" bottom={0} paddingBottom="md" width="100%">
      <Box
        alignItems="center"
        borderColor="deprecated_background1"
        borderTopColor="lightBorder"
        borderWidth={1}
        flexDirection="row"
        justifyContent="space-between"
        px="xl"
        py="md">
        <Button
          onPress={() => {
            impactAsync()
            navigation.navigate(Tabs.Home, { merge: true })
          }}>
          <HomeTabIcon focused={state.index === 1} />
        </Button>
        <Button
          onPress={() => {
            impactAsync()
            navigation.navigate(Tabs.Portfolio, { merge: true })
          }}>
          <WalletTabIcon focused={state.index === 0} />
        </Button>
        <Box
          shadowColor="deprecated_primary1"
          shadowOffset={{ width: 0, height: 8 }}
          shadowOpacity={isDarkMode ? 0.4 : 0}
          shadowRadius={6}>
          <IconButton
            icon={SwapTabIcon}
            name={ElementName.TabBarSwap}
            testID={ElementName.TabBarSwap}
            variant="primary"
            onPress={() => {
              notificationAsync()
              navigation.navigate(Screens.Swap)
            }}
          />
        </Box>
        <Button
          onPress={() => {
            impactAsync()
            navigation.navigate(Tabs.NFT, { merge: true })
          }}>
          <NFTTabIcon focused={state.index === 2} />
        </Button>
        <Button
          onPress={() => {
            impactAsync()
            navigation.navigate(Tabs.Explore, { merge: true })
          }}>
          <ExploreTabIcon focused={state.index === 3} />
        </Button>
      </Box>
    </Box>
  )
}
