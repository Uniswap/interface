import { useTheme } from '@shopify/restyle'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAppDispatch } from 'src/app/hooks'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import BookOpenIcon from 'src/assets/icons/book-open.svg'
import CoffeeIcon from 'src/assets/icons/coffee.svg'
import HeartIcon from 'src/assets/icons/heart.svg'
import HelpIcon from 'src/assets/icons/help.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import TestnetsIcon from 'src/assets/icons/testnets.svg'
import TwitterIcon from 'src/assets/logos/twitter.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Switch } from 'src/components/buttons/Switch'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BackButtonRow } from 'src/components/layout/BackButtonRow'
import { Screen } from 'src/components/layout/Screen'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { UniconTestModal } from 'src/components/unicons/UniconTestModal'
import { ChainId, TESTNET_CHAIN_IDS } from 'src/constants/chains'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { useActiveChainIds } from 'src/features/chains/utils'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useAccounts, useActiveAccountAddress } from 'src/features/wallet/hooks'
import { resetWallet, setFinishedOnboarding } from 'src/features/wallet/walletSlice'
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
  const showDevSettings = isEnabled(TestConfig.ShowDevSettings)
  const sections: SettingsSection[] = useMemo(
    () => [
      {
        subTitle: t('App settings'),
        data: [
          {
            action: <Switch value={isRinkebyActive} onValueChange={onToggleTestnets} />,
            text: t('Testnets'),
            subText: t('Allow connections to test networks'),
            icon: <TestnetsIcon color={theme.colors.textSecondary} />,
          },
        ],
      },
      {
        subTitle: t('Support and feedback'),
        data: [
          {
            externalLink: 'https://help.uniswap.org',
            text: t('Help Center'),
            icon: <HelpIcon color={theme.textSecondary} />,
          },
          {
            externalLink: 'https://twitter.com/Uniswap',
            text: t('Uniswap Labs Twitter'),
            icon: <TwitterIcon color={theme.colors.textSecondary} />,
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
            icon: <LockIcon color={theme.colors.textSecondary} />,
          },
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: 'https://uniswap.org/terms-of-service',
              headerTitle: t('Uniswap Labs Terms of Service'),
            },
            text: t('Uniswap Labs Terms of Service'),
            icon: <BookOpenIcon color={theme.colors.textSecondary} />,
          },
        ],
      },
      {
        subTitle: t('Testing'),
        data: [
          {
            component: <TestUniconsRow />,
          },
        ],
      },
      {
        subTitle: t('Developer settings'),
        isHidden: !showDevSettings,
        data: [
          {
            screen: Screens.SettingsChains,
            text: t('Chains'),
            // TODO use chains icon when available
            icon: (
              <CoffeeIcon
                color={theme.colors.textSecondary}
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
              <CoffeeIcon
                color={theme.colors.textSecondary}
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
              <CoffeeIcon
                color={theme.colors.textSecondary}
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
                color={theme.colors.textSecondary}
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
    [isRinkebyActive, onToggleTestnets, t, theme, showDevSettings]
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
            <Text color="textSecondary" fontWeight="500" variant="body">
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
      pl="xxs"
      onPress={() => {
        navigation.goBack()
        dispatch(resetWallet())
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      }}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between">
        <Box alignItems="center" flexDirection="row">
          <HeartIcon
            color={theme.colors.textSecondary}
            height={20}
            strokeLinecap="round"
            strokeWidth="1.5"
            width={20}
          />
          <Text fontWeight="500" ml="md" variant="subhead">
            {t('Onboarding')}
          </Text>
        </Box>
        <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
      </Box>
    </Button>
  )
}

function TestUniconsRow() {
  const theme = useTheme()
  const { t } = useTranslation()
  const [showUniconsModal, setShowUniconsModal] = useState(false)
  const activeAddress = useActiveAccountAddress()

  return (
    <>
      <Button
        name="DEBUG_Settings_Unicons"
        pb="md"
        pl="xxs"
        onPress={() => setShowUniconsModal(true)}>
        <Box alignItems="center" flexDirection="row" justifyContent="space-between">
          <Box alignItems="center" flexDirection="row">
            <Unicon
              address={activeAddress ?? '0x11e4857bb9993a50c685a79afad4e6f65d518dda'}
              size={32}
            />
            <Text fontWeight="500" ml="md" variant="subhead">
              {t('Show Unicons')}
            </Text>
          </Box>
          <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
        </Box>
      </Button>
      {showUniconsModal && <UniconTestModal onClose={() => setShowUniconsModal(false)} />}
    </>
  )
}

function WalletSettings() {
  const DEFAULT_ACCOUNTS_TO_DISPLAY = 5

  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useSettingsStackNavigation()
  const addressToAccount = useAccounts()
  const [showAll, setShowAll] = useState(false)

  const allAccounts = useMemo(() => Object.values(addressToAccount), [addressToAccount])

  const toggleViewAll = () => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: string) => {
    navigation.navigate(Screens.SettingsWallet, { address })
  }

  return (
    <Box flexDirection="column" mb="md">
      <BackButtonRow>
        <Text variant="subhead">{t('Settings')}</Text>
      </BackButtonRow>

      <Flex row justifyContent="space-between">
        <Text color="textSecondary" fontWeight="500" variant="body">
          {t('Wallet settings')}
        </Text>
        {allAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY && (
          <Button onPress={toggleViewAll}>
            <Text color="textSecondary" mb="sm" variant="subheadSmall">
              {showAll ? t('Hide') : t('View all')}
            </Text>
          </Button>
        )}
      </Flex>
      {allAccounts
        .slice(0, showAll ? allAccounts.length : DEFAULT_ACCOUNTS_TO_DISPLAY)
        .map((account) => (
          <Button
            key={account.address}
            pl="xxs"
            py="sm"
            onPress={() => handleNavigation(account.address)}>
            <Box alignItems="center" flexDirection="row" justifyContent="space-between">
              <AddressDisplay
                showAddressAsSubtitle
                address={account.address}
                showViewOnly={account.type === AccountType.Readonly}
                size={36}
                variant="body"
                verticalGap="none"
              />
              <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
            </Box>
          </Button>
        ))}
    </Box>
  )
}
