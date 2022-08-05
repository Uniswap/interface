import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { SettingsStackParamList, useSettingsStackNavigation } from 'src/app/navigation/types'
import NotificationIcon from 'src/assets/icons/bell.svg'
import BriefcaseIcon from 'src/assets/icons/briefcase.svg'
import CloudIcon from 'src/assets/icons/cloud.svg'
import EditIcon from 'src/assets/icons/edit.svg'
import GlobalIcon from 'src/assets/icons/global.svg'
import PencilIcon from 'src/assets/icons/pencil.svg'
import TrendingUpIcon from 'src/assets/icons/trending-up.svg'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Switch } from 'src/components/buttons/Switch'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType, BackupType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useSelectAccountNotificationSetting } from 'src/features/wallet/hooks'
import {
  selectHideSmallBalances,
  selectSortedMnemonicAccounts,
} from 'src/features/wallet/selectors'
import { setShowSmallBalances } from 'src/features/wallet/walletSlice'
import { showNotificationSettingsAlert } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { opacify } from 'src/utils/colors'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { Screens } from './Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWallet>

export function SettingsWallet({
  route: {
    params: { address },
  },
}: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useTheme()
  const addressToAccount = useAccounts()
  const mnemonicWallets = useAppSelector(selectSortedMnemonicAccounts)
  const currentAccount = addressToAccount[address]
  const readonly = currentAccount?.type === AccountType.Readonly
  const navigation = useSettingsStackNavigation()

  const hasICloudBackup = currentAccount?.backups?.includes(BackupType.Cloud)

  // Should not show remove option if we have only one account remaining, or only one seed phrase wallet remaining
  const shouldHideRemoveOption =
    Object.values(addressToAccount).length === 1 ||
    (mnemonicWallets.length === 1 && currentAccount.type === AccountType.Native)

  const notificationOSPermission = useNotificationOSPermissionsEnabled()
  const notificationsEnabledOnFirebase = useSelectAccountNotificationSetting(address)
  // Can't control switch logic directly from hook outputs because it makes the switch UI choppy
  const [notificationSwitchEnabled, setNotificationSwitchEnabled] = useState<boolean>(
    notificationsEnabledOnFirebase && notificationOSPermission === NotificationPermission.Enabled
  )

  // Need to trigger a state update when the user backgrounds the app to enable notifications and then returns to this screen
  useAppStateTrigger('background', 'active', () => {
    setNotificationSwitchEnabled(
      notificationOSPermission === NotificationPermission.Enabled && notificationsEnabledOnFirebase
    )
  })

  const [showRemoveWalletModal, setShowRemoveWalletModal] = useState(false)
  // cleanup modal on exit
  useEffect(() => {
    return () => setShowRemoveWalletModal(false)
  }, [])

  const onChangeNotificationSettings = (enabled: boolean) => {
    if (notificationOSPermission === NotificationPermission.Enabled) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.TogglePushNotificationParams,
          enabled,
          address,
        })
      )
      setNotificationSwitchEnabled(enabled)
    } else {
      promptPushPermission(() => {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.TogglePushNotificationParams,
            enabled: true,
            address,
          })
        )
        setNotificationSwitchEnabled(enabled)
      }, showNotificationSettingsAlert)
    }
  }

  const removeWallet = () => {
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Remove,
        address,
      })
    )
    navigation.goBack()
  }

  const cancelWalletRemove = () => {
    setShowRemoveWalletModal(false)
  }

  const hideSmallBalancesEnabled = useAppSelector(selectHideSmallBalances)

  const toggleHideSmallBalances = () => {
    dispatch(setShowSmallBalances(hideSmallBalancesEnabled))
  }

  const sections: SettingsSection[] = [
    {
      subTitle: t('Wallet preferences'),
      data: [
        {
          screen: Screens.SettingsWalletEdit,
          text: t('Edit nickname or theme'),
          icon: <EditIcon color={theme.colors.textSecondary} />,
          screenProps: { address },
        },
        {
          action: (
            <Switch
              disabled={notificationOSPermission === NotificationPermission.Loading}
              value={notificationSwitchEnabled}
              onValueChange={onChangeNotificationSettings}
            />
          ),
          text: t('Notifications'),
          icon: <NotificationIcon color={theme.colors.textSecondary} />,
        },
        {
          action: (
            <Switch value={hideSmallBalancesEnabled} onValueChange={toggleHideSmallBalances} />
          ),
          text: t('Hide small balances'),
          icon: <TrendingUpIcon color={theme.colors.textSecondary} />,
        },
        {
          screen: Screens.SettingsWalletManageConnection,
          text: t('Manage connections'),
          icon: <GlobalIcon color={theme.colors.textSecondary} />,
          screenProps: { address },
          isHidden: readonly,
        },
      ],
    },
    {
      subTitle: t('Security'),
      isHidden: readonly,
      data: [
        {
          screen: Screens.SettingsViewSeedPhrase,
          text: t('Recovery phrase'),
          icon: (
            <Flex px="xxs">
              <BriefcaseIcon color={theme.colors.textSecondary} height={22} width={22} />
            </Flex>
          ),
          screenProps: { address },
          isHidden: readonly,
        },
        {
          screen: hasICloudBackup
            ? Screens.SettingsCloudBackupStatus
            : Screens.SettingsCloudBackupScreen,
          screenProps: { address },
          text: t('iCloud backup'),
          icon: (
            <Flex px="xxs">
              <CloudIcon color={theme.colors.textSecondary} height={22} width={22} />
            </Flex>
          ),
          isHidden: readonly,
        },
        {
          screen: Screens.SettingsManualBackup,
          screenProps: { address },
          text: t('Manual backup'),
          icon: (
            <Flex px="xxs">
              <PencilIcon color={theme.colors.textSecondary} height={20} width={20} />
            </Flex>
          ),
          isHidden: readonly,
        },
      ],
    },
  ]

  const renderItem = ({
    item,
  }: ListRenderItemInfo<SettingsSectionItem | SettingsSectionItemComponent>) => {
    if ('component' in item) {
      return item.component
    }
    if (item.isHidden) return null
    return <SettingsRow key={item.screen} navigation={navigation} page={item} theme={theme} />
  }

  return (
    <Screen px="lg" py="lg">
      <Box flex={1}>
        <BackHeader alignment="left" mb="lg">
          <AddressDisplay
            address={address}
            showViewOnly={readonly}
            variant="subhead"
            verticalGap="none"
          />
        </BackHeader>
        <SectionList
          keyExtractor={(_item, index) => 'wallet_settings' + index}
          renderItem={renderItem}
          renderSectionHeader={({ section: { subTitle } }) => (
            <Box bg="backgroundBackdrop" pb="md">
              <Text color="textSecondary" fontWeight="500" variant="body">
                {subTitle}
              </Text>
            </Box>
          )}
          sections={sections.filter((p) => !p.isHidden)}
          showsVerticalScrollIndicator={false}
        />
      </Box>
      <PrimaryButton
        label={t('Remove wallet')}
        name={ElementName.Remove}
        style={{ backgroundColor: opacify(15, theme.colors.accentFailure) }}
        testID={ElementName.Remove}
        textColor="accentFailure"
        visible={!shouldHideRemoveOption}
        width="100%"
        onPress={() => setShowRemoveWalletModal(true)}
      />
      {!!showRemoveWalletModal && !!currentAccount && (
        <RemoveAccountModal
          accountType={currentAccount.type}
          onCancel={cancelWalletRemove}
          onConfirm={removeWallet}
        />
      )}
    </Screen>
  )
}
