import { BaseTheme, useTheme } from '@shopify/restyle'
import React, { ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useDispatch } from 'react-redux'
import {
  SettingsStackNavigationProp,
  SettingsStackParamList,
  useSettingsStackNavigation,
} from 'src/app/navigation/types'
import ChatBubbleIcon from 'src/assets/icons/chat-bubble.svg'
import TwitterIcon from 'src/assets/icons/twitter.svg'
import CoffeeIcon from 'src/assets/icons/coffee.svg'
import StarIcon from 'src/assets/icons/star.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'
import { BlueToPinkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Chevron } from 'src/components/icons/Chevron'
import { PopoutArrow } from 'src/components/icons/PopoutArrow'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { shortenAddress } from 'src/utils/addresses'
import { openUri } from 'src/utils/linking'

interface SettingsSubPage {
  screen?: keyof SettingsStackParamList
  externalLink?: string
  text: string
  icon: ReactElement
}
interface SettingsPage {
  subTitle: string
  subItems: SettingsSubPage[]
}

export function SettingsScreen() {
  const navigation = useSettingsStackNavigation()
  const theme = useTheme()
  const { t } = useTranslation()

  // Defining them inline instead of outside component b.c. they need t()
  const pages: SettingsPage[] = useMemo(
    () => [
      {
        subTitle: 'Support and feedback',
        subItems: [
          {
            screen: Screens.SettingsHelpCenter,
            text: t('Help Center'),
            icon: (
              <ChatBubbleIcon
                color={theme.colors.deprecated_textColor}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
          {
            externalLink: 'https://twitter.com/Uniswap',
            text: t('Uniswap Labs Twitter'),
            icon: (
              <TwitterIcon
                color={theme.colors.deprecated_textColor}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
        ],
      },
      {
        subTitle: 'About',
        subItems: [
          {
            screen: Screens.SettingsChains,
            text: t('Chains'),
            // TODO use chains icon when available
            icon: (
              <ChatBubbleIcon
                color={theme.colors.deprecated_textColor}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
          {
            screen: Screens.SettingsSupport,
            text: t('Support'),
            icon: (
              <ChatBubbleIcon
                color={theme.colors.deprecated_textColor}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
          {
            screen: Screens.SettingsTestConfigs,
            text: 'Test Configs',
            icon: (
              <ChatBubbleIcon
                color={theme.colors.deprecated_textColor}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
          {
            screen: Screens.Dev,
            text: t('Dev Options'),
            icon: (
              <CoffeeIcon
                color={theme.colors.deprecated_textColor}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
        ],
      },
    ],
    [t, theme]
  )

  return (
    <Screen px="lg">
      <ScrollView contentContainerStyle={flex.fill}>
        <Box alignItems="center" flexDirection="row" mb="lg">
          <BackButton mr="md" />
          <Text variant="subHead1">{t('Settings')}</Text>
        </Box>
        {<ActiveAccountSummary />}
        {pages.map((o) => (
          <Box flexDirection="column" mb="md">
            <Text color="deprecated_gray200" mb="sm">
              {o.subTitle}
            </Text>
            {o.subItems.map((item) => (
              <SettingsRow key={item.screen} navigation={navigation} page={item} theme={theme} />
            ))}
          </Box>
        ))}
        <OnboardingRow />
      </ScrollView>
    </Screen>
  )
}

function OnboardingRow() {
  const theme = useTheme()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigation = useSettingsStackNavigation()

  return (
    <Button
      mt="md"
      name="DEBUG_Settings_Navigate"
      px="sm"
      py="sm"
      onPress={() => {
        navigation.goBack()
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      }}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Box alignItems="center" flexDirection="row">
          <StarIcon
            color={theme.colors.deprecated_textColor}
            height={20}
            strokeLinecap="round"
            strokeWidth="1.5"
            width={20}
          />
          <Text fontWeight="500" ml="md" variant="subHead1">
            {t('Onboarding')}
          </Text>
        </Box>
        <Chevron color={theme.colors.deprecated_gray200} direction="e" height={16} width={16} />
      </Box>
    </Button>
  )
}

interface SettingsRowProps {
  page: SettingsSubPage
  navigation: SettingsStackNavigationProp
  theme: BaseTheme
}

function SettingsRow({
  page: { screen, icon, text, externalLink },
  navigation,
  theme,
}: SettingsRowProps) {
  const handleRow = () => {
    if (screen) {
      navigation.navigate(screen)
    } else {
      openUri(externalLink!)
    }
  }
  return (
    <Button name="DEBUG_Settings_Navigate" px="sm" py="sm" onPress={handleRow}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Box alignItems="center" flexDirection="row">
          {icon}
          <Text fontWeight="500" ml="md" variant="subHead1">
            {text}
          </Text>
        </Box>
        {screen ? (
          <Chevron color={theme.colors.deprecated_gray200} direction="e" height={16} width={16} />
        ) : (
          <PopoutArrow color={theme.colors.deprecated_gray200} size={24} />
        )}
      </Box>
    </Button>
  )
}

function ActiveAccountSummary() {
  const activeAccount = useActiveAccount()
  if (!activeAccount) return null
  return (
    <Box alignItems="center" borderRadius="lg" overflow="hidden" p="md">
      <GradientBackground opacity={1}>
        <BlueToPinkRadial />
      </GradientBackground>
      <AddressDisplay address={activeAccount.address} size={50} variant="mediumLabel" />
      <CopyTextButton
        copyText={activeAccount.address}
        mt="sm"
        name={ElementName.Copy}
        textVariant="caption">
        {shortenAddress(activeAccount.address, 4)}
      </CopyTextButton>
    </Box>
  )
}
