import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { SettingsStackParamList, useSettingsStackNavigation } from 'src/app/navigation/types'
import NotificationIcon from 'src/assets/icons/bell.svg'
import BriefcaseIcon from 'src/assets/icons/briefcase.svg'
import CloudIcon from 'src/assets/icons/cloud.svg'
import EditIcon from 'src/assets/icons/edit.svg'
import GlobalIcon from 'src/assets/icons/global.svg'
import TrendingUpIcon from 'src/assets/icons/trending-up.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Switch } from 'src/components/buttons/Switch'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, {
  captionForAccountRemovalWarning,
} from 'src/components/modals/WarningModal/WarningModal'
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
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType, BackupType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useSelectAccountNotificationSetting } from 'src/features/wallet/hooks'
import {
  selectHideSmallBalances,
  selectSortedSignerMnemonicAccounts,
} from 'src/features/wallet/selectors'
import { setShowSmallBalances } from 'src/features/wallet/walletSlice'
import { showNotificationSettingsAlert } from 'src/screens/Onboarding/NotificationsSetupScreen'
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
  const mnemonicWallets = useAppSelector(selectSortedSignerMnemonicAccounts)
  const currentAccount = addressToAccount[address]
  const readonly = currentAccount?.type === AccountType.Readonly
  const navigation = useSettingsStackNavigation()

  const hasICloudBackup = currentAccount?.backups?.includes(BackupType.Cloud)

  // Should not show remove option if we have only one account remaining, or only one seed phrase wallet remaining
  const shouldHideRemoveOption =
    Object.values(addressToAccount).length === 1 ||
    (mnemonicWallets.length === 1 && currentAccount.type === AccountType.SignerMnemonic)

  const notificationOSPermission = useNotificationOSPermissionsEnabled()
  const notificationsEnabledOnFirebase = useSelectAccountNotificationSetting(address)

  const [notificationSwitchEnabled, setNotificationSwitchEnabled] = useState<boolean>(
    notificationsEnabledOnFirebase
  )

  // Need to trigger a state update when the user backgrounds the app to enable notifications and then returns to this screen
  useFocusEffect(
    useCallback(
      () =>
        setNotificationSwitchEnabled(
          notificationsEnabledOnFirebase &&
            notificationOSPermission === NotificationPermission.Enabled
        ),
      [notificationOSPermission, notificationsEnabledOnFirebase]
    )
  )

  const [showRemoveWalletModal, setShowRemoveWalletModal] = useState(false)
  // cleanup modal on exit
  useEffect(() => {
    return () => setShowRemoveWalletModal(false)
  }, [])

  const onChangeNotificationSettings = (enabled: boolean) => {
    if (notificationOSPermission === NotificationPermission.Enabled) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.TogglePushNotification,
          enabled,
          address,
        })
      )
      setNotificationSwitchEnabled(enabled)
    } else {
      promptPushPermission(() => {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.TogglePushNotification,
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
        notificationsEnabled: !!addressToAccount[address].pushNotificationsEnabled,
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

  const iconProps: SvgProps = {
    color: theme.colors.textSecondary,
    height: 24,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '2',
    width: 24,
  }

  const sections: SettingsSection[] = [
    {
      subTitle: t('Wallet preferences'),
      data: [
        {
          screen: Screens.SettingsWalletEdit,
          text: t('Nickname and theme'),
          icon: <EditIcon fill={theme.colors.textSecondary} {...iconProps} />,
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
          icon: <NotificationIcon {...iconProps} />,
        },
        {
          action: (
            <Switch value={hideSmallBalancesEnabled} onValueChange={toggleHideSmallBalances} />
          ),
          text: t('Hide small balances'),
          icon: <TrendingUpIcon {...iconProps} />,
        },
        {
          screen: Screens.SettingsWalletManageConnection,
          text: t('Manage connections'),
          icon: <GlobalIcon {...iconProps} />,
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
          icon: <BriefcaseIcon {...iconProps} />,
          screenProps: { address },
          isHidden: readonly,
        },
        {
          screen: hasICloudBackup
            ? Screens.SettingsCloudBackupStatus
            : Screens.SettingsCloudBackupScreen,
          screenProps: { address },
          text: t('iCloud backup'),
          icon: <CloudIcon {...iconProps} />,
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
    <Screen>
      <BackHeader alignment="left" mx="md" pt="md">
        <AddressDisplay
          address={address}
          showViewOnly={readonly}
          variant="subhead"
          verticalGap="none"
        />
      </BackHeader>

      <Flex fill p="lg">
        <Box flex={1}>
          <SectionList
            ItemSeparatorComponent={() => <Flex pt="xs" />}
            keyExtractor={(_item, index) => 'wallet_settings' + index}
            renderItem={renderItem}
            renderSectionFooter={() => <Flex pt="lg" />}
            renderSectionHeader={({ section: { subTitle } }) => (
              <Box bg="backgroundBackdrop" pb="sm">
                <Text color="textSecondary" variant="subhead">
                  {subTitle}
                </Text>
              </Box>
            )}
            sections={sections.filter((p) => !p.isHidden)}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </Box>
        <PrimaryButton
          height={56}
          label={t('Remove wallet')}
          name={ElementName.Remove}
          style={{
            backgroundColor: theme.colors.accentFailureSoft,
          }}
          testID={ElementName.Remove}
          textColor="accentFailure"
          textVariant="largeLabel"
          visible={!shouldHideRemoveOption}
          width="100%"
          onPress={() => setShowRemoveWalletModal(true)}
        />

        {!!showRemoveWalletModal && !!currentAccount && (
          <WarningModal
            useBiometric
            caption={captionForAccountRemovalWarning(currentAccount.type, t)}
            closeText={t('Cancel')}
            confirmText={t('Remove')}
            isVisible={showRemoveWalletModal}
            modalName={ModalName.RemoveWallet}
            severity={WarningSeverity.High}
            title={t('Are you sure?')}
            onClose={cancelWalletRemove}
            onConfirm={removeWallet}
          />
        )}
      </Flex>
    </Screen>
  )
}
