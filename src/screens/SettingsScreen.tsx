import { useTheme } from '@shopify/restyle'
import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import BookOpenIcon from 'src/assets/icons/book-open.svg'
import FaceIdIcon from 'src/assets/icons/faceid.svg'
import FlashbotsIcon from 'src/assets/icons/flashbots.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { useDeviceSupportsFaceId } from 'src/features/biometrics/hooks'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { useAccounts } from 'src/features/wallet/hooks'
import { resetWallet, setFinishedOnboarding } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { getFullAppVersion } from 'src/utils/version'

export function SettingsScreen() {
  const navigation = useSettingsStackNavigation()
  const theme = useTheme()
  const { t } = useTranslation()

  // check if device supports faceId authentication, if not, hide faceId option
  const deviceSupportsFaceId = useDeviceSupportsFaceId()

  // Defining them inline instead of outside component b.c. they need t()
  const showDevSettings = isEnabled(TestConfig.ShowDevSettings)
  const sections: SettingsSection[] = useMemo((): SettingsSection[] => {
    const iconProps: SvgProps = {
      color: theme.colors.textSecondary,
      height: 24,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2',
      width: 24,
    }

    return [
      {
        subTitle: t('App settings'),
        data: [
          {
            screen: Screens.SettingsFaceId,
            isHidden: !deviceSupportsFaceId,
            text: 'Face ID',
            icon: <FaceIdIcon {...iconProps} />,
          },
          // @TODO: add back testnet toggle when Zerion provides data for testnets correctly.
        ],
      },
      {
        subTitle: t('About'),
        data: [
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: 'https://uniswap.org/terms-of-service',
              headerTitle: t('Privacy Policy'),
            },
            text: t('Privacy Policy'),
            icon: <LockIcon {...iconProps} />,
          },
          {
            screen: Screens.WebView,
            screenProps: {
              uriLink: 'https://uniswap.org/terms-of-service',
              headerTitle: t('Terms of Service'),
            },
            text: t('Terms of Service'),
            icon: <BookOpenIcon {...iconProps} />,
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
            icon: <FlashbotsIcon {...iconProps} />,
          },
          {
            screen: Screens.SettingsSupport,
            text: t('Support'),
            icon: <FlashbotsIcon {...iconProps} />,
          },
          {
            screen: Screens.SettingsTestConfigs,
            text: 'Test Configs',
            icon: <FlashbotsIcon {...iconProps} />,
          },
          {
            screen: Screens.Dev,
            text: t('Dev Options'),
            icon: <FlashbotsIcon {...iconProps} />,
          },
          { component: <OnboardingRow iconProps={iconProps} /> },
        ],
      },
    ]
  }, [t, theme, showDevSettings, deviceSupportsFaceId])

  const renderItem = ({
    item,
  }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>) => {
    if (item.isHidden) return null
    if ('component' in item) return item.component
    return <SettingsRow key={item.screen} navigation={navigation} page={item} theme={theme} />
  }

  return (
    <HeaderScrollScreen
      contentHeader={
        <BackHeader alignment="left" mx="md" pt="md">
          <Text variant="subheadLarge">{t('Settings')}</Text>
        </BackHeader>
      }
      fixedHeader={
        <BackHeader mb="xxs">
          <Text variant="subheadLarge">{t('Settings')}</Text>
        </BackHeader>
      }>
      <Flex px="lg" py="lg">
        <SectionList
          ItemSeparatorComponent={() => <Flex pt="xs" />}
          ListFooterComponent={<FooterSettings />}
          ListHeaderComponent={<WalletSettings />}
          keyExtractor={(_item, index) => 'settings' + index}
          renderItem={renderItem}
          renderSectionFooter={() => <Flex pt="lg" />}
          renderSectionHeader={({ section: { subTitle } }) => (
            <Box bg="background0" pb="sm">
              <Text color="textSecondary" variant="bodyLarge">
                {subTitle}
              </Text>
            </Box>
          )}
          sections={sections.filter((p) => !p.isHidden)}
          showsVerticalScrollIndicator={false}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}

function OnboardingRow({ iconProps }: { iconProps: SvgProps }) {
  const theme = useTheme()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigation = useSettingsStackNavigation()

  return (
    <TouchableArea
      name="DEBUG_Settings_Navigate"
      onPress={() => {
        navigation.goBack()
        dispatch(resetWallet())
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      }}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" py="xxs">
        <Box alignItems="center" flexDirection="row">
          <Flex centered height={32} width={32}>
            <FlashbotsIcon {...iconProps} />
          </Flex>
          <Text ml="sm" variant="bodyLarge">
            {t('Onboarding')}
          </Text>
        </Box>
        <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
      </Box>
    </TouchableArea>
  )
}

function WalletSettings() {
  const DEFAULT_ACCOUNTS_TO_DISPLAY = 5

  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useSettingsStackNavigation()
  const addressToAccount = useAccounts()
  const [showAll, setShowAll] = useState(false)

  const allAccounts = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return a.derivationIndex - b.derivationIndex
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return [..._mnemonicWallets, ..._viewOnlyWallets]
  }, [addressToAccount])

  const toggleViewAll = () => {
    setShowAll(!showAll)
  }

  const handleNavigation = (address: string) => {
    navigation.navigate(Screens.SettingsWallet, { address })
  }

  return (
    <Box flexDirection="column" mb="md">
      <Flex row justifyContent="space-between">
        <Text color="textSecondary" variant="bodyLarge">
          {t('Wallet settings')}
        </Text>
        {allAccounts.length > DEFAULT_ACCOUNTS_TO_DISPLAY && (
          <TouchableArea onPress={toggleViewAll}>
            <Text color="textSecondary" mb="sm" variant="subheadSmall">
              {showAll ? t('View less') : t('View all')}
            </Text>
          </TouchableArea>
        )}
      </Flex>
      {allAccounts
        .slice(0, showAll ? allAccounts.length : DEFAULT_ACCOUNTS_TO_DISPLAY)
        .map((account) => (
          <TouchableArea
            key={account.address}
            pl="xxs"
            py="sm"
            onPress={() => handleNavigation(account.address)}>
            <Box alignItems="center" flexDirection="row" justifyContent="space-between">
              <AddressDisplay
                showAddressAsSubtitle
                address={account.address}
                captionVariant="buttonLabelMicro"
                showViewOnly={account.type === AccountType.Readonly}
                size={36}
                variant="bodyLarge"
                verticalGap="none"
              />
              <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
            </Box>
          </TouchableArea>
        ))}
    </Box>
  )
}

function FooterSettings() {
  return (
    <Text color="textTertiary" marginTop="xs" variant="bodySmall">
      {`Version ${getFullAppVersion()}`}
    </Text>
  )
}
