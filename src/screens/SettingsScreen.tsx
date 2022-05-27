import { BaseTheme, useTheme } from '@shopify/restyle'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAppDispatch } from 'src/app/hooks'
import {
  SettingsStackNavigationProp,
  SettingsStackParamList,
  useSettingsStackNavigation,
} from 'src/app/navigation/types'
import BookOpenIcon from 'src/assets/icons/book-open.svg'
import ChatBubbleIcon from 'src/assets/icons/chat-bubble.svg'
import CoffeeIcon from 'src/assets/icons/coffee.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import StarIcon from 'src/assets/icons/star.svg'
import TestnetsIcon from 'src/assets/icons/testnets.svg'
import TwitterIcon from 'src/assets/logos/twitter.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { Switch } from 'src/components/buttons/Switch'
import { Chevron } from 'src/components/icons/Chevron'
import { PopoutArrow } from 'src/components/icons/PopoutArrow'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ChainId, TESTNET_CHAIN_IDS } from 'src/constants/chains'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { openUri } from 'src/utils/linking'

interface SettingsSectionItemComponent {
  component: ReactElement
}

interface SettingsSectionItem {
  screen?: keyof SettingsStackParamList
  screenProps?: any
  externalLink?: string
  action?: ReactElement
  text: string
  subText?: string
  icon: ReactElement
}
interface SettingsSection {
  subTitle: string
  subItems: (SettingsSectionItem | SettingsSectionItemComponent)[]
  isHidden?: boolean
}

export function SettingsScreen() {
  const navigation = useSettingsStackNavigation()
  const theme = useTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const activeChains = useActiveChainIds()
  const isRinkebyActive = activeChains.includes(ChainId.Rinkeby)
  const onToggleTestnets = useCallback(() => {
    // always rely on the state of rinkeby
    TESTNET_CHAIN_IDS.forEach((chainId) =>
      dispatch(setChainActiveStatus({ chainId, isActive: !isRinkebyActive }))
    )
  }, [dispatch, isRinkebyActive])

  // Defining them inline instead of outside component b.c. they need t()
  const pages: SettingsSection[] = useMemo(
    () => [
      {
        subTitle: t('App settings'),
        subItems: [
          {
            action: <Switch value={isRinkebyActive} onValueChange={onToggleTestnets} />,
            text: t('Testnets'),
            subText: t('Allow connections to test networks'),
            icon: (
              <TestnetsIcon
                color={theme.colors.neutralTextSecondary}
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
        subTitle: t('Support and feedback'),
        subItems: [
          {
            screen: Screens.SettingsWebviewOption,
            screenProps: {
              uriLink: 'https://help.uniswap.org',
              headerTitle: t('Help Center'),
            },
            text: t('Help Center'),
            icon: (
              <ChatBubbleIcon
                color={theme.colors.neutralTextSecondary}
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
                color={theme.colors.neutralTextSecondary}
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
        subTitle: t('About'),
        subItems: [
          {
            screen: Screens.SettingsWebviewOption,
            screenProps: {
              uriLink: 'https://uniswap.org/terms-of-service',
              headerTitle: t('Uniswap Labs Privacy Policy'),
            },
            text: t('Uniswap Labs Privacy Policy'),
            icon: (
              <LockIcon
                color={theme.colors.neutralTextSecondary}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
          {
            screen: Screens.SettingsWebviewOption,
            screenProps: {
              uriLink: 'https://uniswap.org/terms-of-service',
              headerTitle: t('Uniswap Labs Terms of Service'),
            },
            text: t('Uniswap Labs Terms of Service'),
            icon: (
              <BookOpenIcon
                color={theme.colors.neutralTextSecondary}
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
        subTitle: t('Developer settings'),
        isHidden: !isEnabled(TestConfig.ShowDevSettings),
        subItems: [
          {
            screen: Screens.SettingsChains,
            text: t('Chains'),
            // TODO use chains icon when available
            icon: (
              <ChatBubbleIcon
                color={theme.colors.neutralTextSecondary}
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
                color={theme.colors.neutralTextSecondary}
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
                color={theme.colors.neutralTextSecondary}
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
                color={theme.colors.neutralTextSecondary}
                height={20}
                strokeLinecap="round"
                strokeWidth="1.5"
                width={20}
              />
            ),
          },
          { component: <OnboardingRow /> },
        ],
      },
    ],
    [isRinkebyActive, onToggleTestnets, t, theme]
  )

  return (
    <Screen p="lg">
      <ScrollView contentContainerStyle={flex.fill}>
        <Flex alignItems="center" flexDirection="row" mb="xl">
          <BackButton color="neutralTextSecondary" />
          <Text variant="largeLabel">{t('Settings')}</Text>
        </Flex>
        <Flex>
          {pages.map((o) => {
            if (o.isHidden) {
              return null
            }
            return (
              <Flex>
                <Text color="neutralTextSecondary" fontWeight="500" variant="body1">
                  {o.subTitle}
                </Text>
                {o.subItems.map((item) => {
                  if ('component' in item) {
                    return item.component
                  }
                  return (
                    <SettingsRow
                      key={item.screen}
                      navigation={navigation}
                      page={item}
                      theme={theme}
                    />
                  )
                })}
              </Flex>
            )
          })}
        </Flex>
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
      name="DEBUG_Settings_Navigate"
      px="sm"
      onPress={() => {
        navigation.goBack()
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      }}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Box alignItems="center" flexDirection="row">
          <StarIcon
            height={20}
            stroke={theme.colors.neutralTextSecondary}
            strokeLinecap="round"
            strokeWidth="1.5"
            width={20}
          />
          <Text fontWeight="500" ml="md" variant="subHead1">
            {t('Onboarding')}
          </Text>
        </Box>
        <Chevron color={theme.colors.neutralTextTertiary} direction="e" height={16} width={16} />
      </Box>
    </Button>
  )
}

interface SettingsRowProps {
  page: SettingsSectionItem
  navigation: SettingsStackNavigationProp
  theme: BaseTheme
}

function SettingsRow({
  page: { screen, screenProps, externalLink, action, icon, text, subText },
  navigation,
  theme,
}: SettingsRowProps) {
  const handleRow = () => {
    if (screen) {
      navigation.navigate(screen, screenProps)
    } else {
      openUri(externalLink!)
    }
  }
  return (
    <Button name="DEBUG_Settings_Navigate" px="sm" onPress={handleRow}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Flex row>
          {icon}
          <Flex gap="none">
            <Text fontWeight="500" variant="subHead1">
              {text}
            </Text>
            {subText && (
              <Text color="neutralTextSecondary" variant="caption">
                {subText}
              </Text>
            )}
          </Flex>
        </Flex>
        {screen ? (
          <Chevron color={theme.colors.neutralTextTertiary} direction="e" height={16} width={16} />
        ) : externalLink ? (
          <PopoutArrow color={theme.colors.neutralTextTertiary} size={24} />
        ) : (
          action
        )}
      </Box>
    </Button>
  )
}
