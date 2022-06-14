import { useTheme } from '@shopify/restyle'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAppDispatch } from 'src/app/hooks'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import BookOpenIcon from 'src/assets/icons/book-open.svg'
import ChatBubbleIcon from 'src/assets/icons/chat-bubble.svg'
import CoffeeIcon from 'src/assets/icons/coffee.svg'
import HeartIcon from 'src/assets/icons/heart.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import TestnetsIcon from 'src/assets/icons/testnets.svg'
import TwitterIcon from 'src/assets/logos/twitter.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Switch } from 'src/components/buttons/Switch'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { SettingsBackButtonRow } from 'src/components/Settings/BackButtonRow'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { ChainId, TESTNET_CHAIN_IDS } from 'src/constants/chains'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { useSignerAccounts } from 'src/features/wallet/hooks'
import { setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'

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
  const sections: SettingsSection[] = useMemo(
    () => [
      {
        subTitle: t('App settings'),
        data: [
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
        data: [
          {
            externalLink: 'https://help.uniswap.org',
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
        data: [
          {
            screen: Screens.WebView,
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
            screen: Screens.WebView,
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
        data: [
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

  const renderItem = ({
    item,
  }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>) => {
    if ('component' in item) {
      return item.component
    }
    return <SettingsRow key={item.screen} navigation={navigation} page={item} theme={theme} />
  }

  return (
    <Screen px="lg" py="lg">
      <SectionList
        ListHeaderComponent={<WalletSettings />}
        keyExtractor={(_item, index) => 'settings' + index}
        renderItem={renderItem}
        renderSectionHeader={({ section: { subTitle } }) => (
          <Box bg="mainBackground" pb="md">
            <Text color="neutralTextSecondary" fontWeight="500" variant="body1">
              {subTitle}
            </Text>
          </Box>
        )}
        sections={sections.filter((p) => !p.isHidden)}
        showsVerticalScrollIndicator={false}
      />
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
          <HeartIcon
            color={theme.colors.neutralTextSecondary}
            height={20}
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

function WalletSettings() {
  const DEFAULT_ACCOUNTS_TO_DISPLAY = 5

  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useSettingsStackNavigation()
  const signerAccounts = useSignerAccounts()
  const [showAll, setShowAll] = useState(false)

  const toggleViewAll = () => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: Address) => {
    navigation.navigate(Screens.SettingsWallet, { address })
  }

  return (
    <Box flexDirection="column" mb="md">
      <SettingsBackButtonRow>
        <Text variant="largeLabel">{t('Settings')}</Text>
      </SettingsBackButtonRow>

      <Flex row justifyContent="space-between">
        <Text color="neutralTextSecondary" fontWeight="500" variant="body1">
          {t('Wallet settings')}
        </Text>
        {signerAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY && (
          <Button onPress={toggleViewAll}>
            <Text color="neutralTextTertiary" mb="sm" variant="subHead2">
              {showAll ? t('Hide') : t('View all')}
            </Text>
          </Button>
        )}
      </Flex>
      {signerAccounts
        .slice(0, showAll ? signerAccounts.length : DEFAULT_ACCOUNTS_TO_DISPLAY)
        .map((account) => (
          <Button
            key={account.address}
            px="sm"
            py="sm"
            onPress={() => handleNavigation(account.address)}>
            <Box alignItems="center" flexDirection="row" justifyContent="space-between">
              <AddressDisplay
                showAddressAsSubtitle
                address={account.address}
                size={36}
                variant="body1"
                verticalGap="none"
              />
              <Chevron
                color={theme.colors.neutralTextTertiary}
                direction="e"
                height={16}
                width={16}
              />
            </Box>
          </Button>
        ))}
    </Box>
  )
}
