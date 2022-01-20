import { BaseTheme, useTheme } from '@shopify/restyle'
import React, { ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import {
  SettingsStackNavigationProp,
  SettingsStackParamList,
  useSettingsStackNavigation,
} from 'src/app/navigation/types'
import ChatBubbleIcon from 'src/assets/icons/chat-bubble.svg'
import CoffeeIcon from 'src/assets/icons/coffee.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'
import { BlueToPinkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Chevron } from 'src/components/icons/Chevron'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { shortenAddress } from 'src/utils/addresses'

interface SettingsPage {
  screen: keyof SettingsStackParamList
  text: string
  icon: ReactElement
}

export function SettingsScreen() {
  const navigation = useSettingsStackNavigation()
  const theme = useTheme()
  const { t } = useTranslation()

  // Defining them inline instead of outside component b.c. they need t()
  const pages: SettingsPage[] = useMemo(
    () => [
      {
        screen: Screens.SettingsChains,
        text: t('Chains'),
        // TODO use chains icon when available
        icon: <ChatBubbleIcon height={20} width={20} />,
      },
      {
        screen: Screens.SettingsSupport,
        text: t('Support'),
        icon: <ChatBubbleIcon height={20} width={20} />,
      },
      {
        screen: Screens.SettingsTestConfigs,
        text: 'Test Configs',
        icon: <ChatBubbleIcon height={20} width={20} />,
      },
      {
        screen: Screens.Dev,
        text: t('Dev Options'),
        icon: <CoffeeIcon height={20} width={20} />,
      },
    ],
    [t]
  )

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={flex.fill}>
        <Box alignItems="center" flexDirection="row" mb="lg">
          <BackButton mr="md" />
          <Text variant="bodyLg">{t('Settings')}</Text>
        </Box>
        {<ActiveAccountSummary />}
        {pages.map((o) => (
          <SettingsRow key={o.screen} navigation={navigation} page={o} theme={theme} />
        ))}
      </ScrollView>
    </SheetScreen>
  )
}

interface SettingsRowProps {
  page: SettingsPage
  navigation: SettingsStackNavigationProp
  theme: BaseTheme
}

function SettingsRow({ page: { screen, icon, text }, navigation, theme }: SettingsRowProps) {
  return (
    <Button mt="md" px="sm" py="sm" onPress={() => navigation.navigate(screen)}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Box alignItems="center" flexDirection="row">
          {icon}
          <Text fontWeight="500" ml="md" variant="bodyLg">
            {text}
          </Text>
        </Box>
        <Chevron color={theme.colors.gray200} direction="e" height={16} width={16} />
      </Box>
    </Button>
  )
}

function ActiveAccountSummary() {
  const activeAccount = useActiveAccount()
  if (!activeAccount) return null
  return (
    <Box alignItems="center" borderRadius="lg" overflow="hidden" p="md">
      <GradientBackground opacity={0.5}>
        <BlueToPinkRadial />
      </GradientBackground>
      <Identicon address={activeAccount.address} size={50} />
      <Text mt="md" variant="h4">
        {activeAccount.name}
      </Text>
      <CopyTextButton copyText={activeAccount.address} mt="sm" textVariant="bodySm">
        {shortenAddress(activeAccount.address, 4)}
      </CopyTextButton>
    </Box>
  )
}
