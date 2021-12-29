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
        icon: <ChatBubbleIcon width={20} height={20} />,
      },
      {
        screen: Screens.SettingsSupport,
        text: t('Support'),
        icon: <ChatBubbleIcon width={20} height={20} />,
      },
      {
        screen: Screens.Dev,
        text: t('Dev Options'),
        icon: <CoffeeIcon width={20} height={20} />,
      },
    ],
    [t]
  )

  return (
    <SheetScreen>
      <ScrollView contentContainerStyle={flex.fill}>
        <Box px="lg">
          <Box flexDirection="row" alignItems="center" mb="lg">
            <BackButton size={30} mr="md" />
            <Text variant="bodyLg">{t('Settings')}</Text>
          </Box>
          {<ActiveAccountSummary />}
          {pages.map((o) => (
            <SettingsRow page={o} navigation={navigation} theme={theme} key={o.screen} />
          ))}
        </Box>
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
    <Button onPress={() => navigation.navigate(screen)} mt="md" px="sm" py="sm">
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center">
          {icon}
          <Text variant="bodyLg" fontWeight="500" ml="md">
            {text}
          </Text>
        </Box>
        <Chevron direction="e" width={16} height={16} color={theme.colors.gray200} />
      </Box>
    </Button>
  )
}

function ActiveAccountSummary() {
  const activeAccount = useActiveAccount()
  if (!activeAccount) return null
  return (
    <Box borderRadius="lg" alignItems="center" p="md" overflow="hidden">
      <GradientBackground opacity={0.5}>
        <BlueToPinkRadial />
      </GradientBackground>
      <Identicon address={activeAccount.address} size={50} />
      <Text variant="h4" mt="md">
        {activeAccount.name}
      </Text>
      <CopyTextButton textVariant="bodySm" mt="sm" copyText={activeAccount.address}>
        {shortenAddress(activeAccount.address, 4)}
      </CopyTextButton>
    </Box>
  )
}
