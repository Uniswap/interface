import { useFocusEffect, useNavigation } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  OnboardingStackNavigationProp,
  SettingsStackNavigationProp,
  SettingsStackParamList,
} from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Switch } from 'src/components/buttons/Switch'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { IS_ANDROID } from 'src/constants/globals'
import { openModal } from 'src/features/modals/modalSlice'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { showNotificationSettingsAlert } from 'src/screens/Onboarding/NotificationsSetupScreen'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import NotificationIcon from 'ui/src/assets/icons/bell.svg'
import ChartIcon from 'ui/src/assets/icons/chart.svg'
import GlobalIcon from 'ui/src/assets/icons/global.svg'
import KeyIcon from 'ui/src/assets/icons/key.svg'
import ShieldQuestionIcon from 'ui/src/assets/icons/shield-question.svg'
import TextEditIcon from 'ui/src/assets/icons/textEdit.svg'
import { iconSizes } from 'ui/src/theme'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import {
  useAccounts,
  useSelectAccountHideSmallBalances,
  useSelectAccountHideSpamTokens,
  useSelectAccountNotificationSetting,
} from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWallet>

export function SettingsWallet({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const addressToAccount = useAccounts()
  const currentAccount = addressToAccount[address]
  const ensName = useENS(ChainId.Mainnet, address)?.name
  const readonly = currentAccount?.type === AccountType.Readonly
  const navigation = useNavigation<SettingsStackNavigationProp & OnboardingStackNavigationProp>()

  const hasCloudBackup = currentAccount?.backups?.includes(BackupType.Cloud)

  const { walletNeedsRestore } = useWalletRestore()

  const hideSmallBalances = useSelectAccountHideSmallBalances(address)
  const hideSpamTokens = useSelectAccountHideSpamTokens(address)
  const notificationOSPermission = useNotificationOSPermissionsEnabled()
  const notificationsEnabledOnFirebase = useSelectAccountNotificationSetting(address)
  const [notificationSwitchEnabled, setNotificationSwitchEnabled] = useState<boolean>(
    notificationsEnabledOnFirebase
  )
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)

  useEffect(() => {
    // If the user deletes the account while on this screen, go back
    if (!currentAccount) {
      navigation.goBack()
    }
  }, [currentAccount, navigation])

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

  const onChangeNotificationSettings = (enabled: boolean): void => {
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

  const toggleHideSmallBalances = (): void => {
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.ToggleShowSmallBalances,
        enabled: hideSmallBalances, // Toggles showSmallBalances since hideSmallBalances is the flipped value of showSmallBalances
        address,
      })
    )
  }

  const toggleHideSpamTokens = (): void => {
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.ToggleShowSpamTokens,
        enabled: hideSpamTokens, // Toggles showSpamTokens since hideSpamTokens is the flipped value of showSpamTokens
        address,
      })
    )
  }

  const iconProps: SvgProps = {
    color: colors.neutral2.get(),
    height: iconSizes.icon24,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '2',
    width: iconSizes.icon24,
  }

  const editNicknameSectionOption: SettingsSectionItem = {
    screen: Screens.SettingsWalletEdit,
    text: t('Nickname'),
    icon: <TextEditIcon fill={colors.neutral2.get()} {...iconProps} />,
    screenProps: { address },
    isHidden: !!ensName,
  }

  const sections: SettingsSection[] = [
    {
      subTitle: t('Wallet preferences'),
      data: [
        ...(unitagsFeatureFlagEnabled ? [] : [editNicknameSectionOption]),
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
          action: <Switch value={hideSmallBalances} onValueChange={toggleHideSmallBalances} />,
          text: t('Hide small balances'),
          icon: <ChartIcon {...iconProps} />,
        },
        {
          action: <Switch value={hideSpamTokens} onValueChange={toggleHideSpamTokens} />,
          text: t('Hide unknown tokens'),
          icon: <ShieldQuestionIcon {...iconProps} />,
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
          icon: <KeyIcon {...iconProps} />,
          screenProps: { address, walletNeedsRestore },
          isHidden: readonly,
        },
        {
          screen: walletNeedsRestore
            ? Screens.OnboardingStack
            : hasCloudBackup
            ? Screens.SettingsCloudBackupStatus
            : Screens.SettingsCloudBackupPasswordCreate,
          screenProps: walletNeedsRestore
            ? {
                screen: OnboardingScreens.RestoreCloudBackupLoading,
                params: {
                  entryPoint: OnboardingEntryPoint.Sidebar,
                  importType: ImportType.Restore,
                },
              }
            : { address },
          text: IS_ANDROID ? t('Google Drive backup') : t('iCloud backup'),
          icon: <Icons.OSDynamicCloudIcon color="$neutral2" size="$icon.24" />,
          isHidden: readonly,
        },
      ],
    },
  ]

  const renderItem = ({
    item,
  }: ListRenderItemInfo<
    SettingsSectionItem | SettingsSectionItemComponent
  >): JSX.Element | null => {
    if ('component' in item) {
      return item.component
    }
    if (item.isHidden) return null
    return <SettingsRow key={item.screen} navigation={navigation} page={item} />
  }

  const onRemoveWallet = (): void => {
    dispatch(
      openModal({
        name: ModalName.RemoveWallet,
        initialState: { address },
      })
    )
  }

  return (
    <Screen>
      <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
        <Flex shrink>
          <AddressDisplay
            hideAddressInSubtitle
            address={address}
            showAccountIcon={false}
            variant="body1"
          />
        </Flex>
      </BackHeader>

      <Flex fill p="$spacing24" pb="$spacing12">
        <Flex fill>
          <SectionList
            ItemSeparatorComponent={renderItemSeparator}
            ListHeaderComponent={
              unitagsFeatureFlagEnabled ? <AddressDisplayHeader address={address} /> : undefined
            }
            keyExtractor={(_item, index): string => 'wallet_settings' + index}
            renderItem={renderItem}
            renderSectionFooter={(): JSX.Element => <Flex pt="$spacing24" />}
            renderSectionHeader={({ section: { subTitle } }): JSX.Element => (
              <Flex bg="$surface1" pb="$spacing12">
                <Text color="$neutral2" variant="body1">
                  {subTitle}
                </Text>
              </Flex>
            )}
            sections={sections.filter((p) => !p.isHidden)}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </Flex>
        <Button testID={ElementName.Remove} theme="detrimental" onPress={onRemoveWallet}>
          {t('Remove wallet')}
        </Button>
      </Flex>
    </Screen>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing8" />

function AddressDisplayHeader({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const ensName = useENS(ChainId.Mainnet, address)?.name
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  // TODO (MOB-2122): GET /address from unitags backend to check for unitag
  const hasUnitag = false && unitagsFeatureFlagEnabled

  const onPressEditProfile = (): void => {
    if (hasUnitag) {
      navigate(Screens.UnitagStack, {
        screen: UnitagScreens.EditProfile,
        params: {
          address,
        },
      })
    } else {
      navigate(Screens.SettingsWalletEdit, {
        address,
      })
    }
  }

  return (
    <Flex gap="$spacing12" justifyContent="flex-start" pb="$spacing16">
      <Flex shrink>
        <AddressDisplay
          address={address}
          captionVariant="subheading2"
          size={iconSizes.icon40}
          variant="body1"
        />
      </Flex>
      {(!ensName || hasUnitag) && (
        <Button
          color="$neutral1"
          fontSize="$small"
          size="medium"
          theme="tertiary"
          onPress={onPressEditProfile}>
          {hasUnitag ? t('Edit profile') : t('Edit label')}
        </Button>
      )}
    </Flex>
  )
}
