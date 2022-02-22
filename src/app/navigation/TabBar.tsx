import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useTheme } from '@shopify/restyle'
import { BlurView } from 'expo-blur'
import { impactAsync, notificationAsync } from 'expo-haptics'
import React from 'react'
import { useColorScheme, ViewStyle } from 'react-native'
import { ExploreTabIcon, WalletTabIcon } from 'src/app/navigation/icons'
import SwapIcon from 'src/assets/icons/swap.svg'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { Box, Flex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens, Tabs } from 'src/screens/Screens'
import { borderRadii } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme<Theme>()
  const isDarkMode = useColorScheme() === 'dark'

  const leftBlurStyle: ViewStyle = {
    overflow: 'hidden',
    borderRadius: borderRadii.md,
    borderWidth: 1,
    borderColor: theme.colors.gray50,
  }

  const SwapTabIcon = <SwapIcon fill="white" height={24} width={24} />

  return (
    <Box bottom={20} position="absolute" width="100%">
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="lg" py="md">
        <Box
          shadowColor="black"
          shadowOffset={{ width: 0, height: 12 }}
          shadowOpacity={0.4}
          shadowRadius={20}>
          <BlurView intensity={90} style={leftBlurStyle} tint={isDarkMode ? 'dark' : 'light'}>
            <Flex
              alignItems="center"
              bg="tabBackground"
              flexDirection="row"
              gap="xl"
              px="lg"
              py="md">
              <Button
                onPress={() => {
                  impactAsync()
                  navigation.navigate(Tabs.Home, { merge: true })
                }}>
                <WalletTabIcon focused={state.index === 0} />
              </Button>
              <Button
                onPress={() => {
                  impactAsync()
                  navigation.navigate(Tabs.Explore, { merge: true })
                }}>
                <ExploreTabIcon focused={state.index === 1} />
              </Button>
            </Flex>
          </BlurView>
        </Box>
        <Box
          shadowColor="black"
          shadowOffset={{ width: 0, height: 12 }}
          shadowOpacity={0.4}
          shadowRadius={20}>
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
      </Box>
    </Box>
  )
}
