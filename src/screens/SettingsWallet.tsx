import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList, useSettingsStackNavigation } from 'src/app/navigation/types'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import NotificationIcon from 'src/assets/icons/bell.svg'
import EditIcon from 'src/assets/icons/edit.svg'
import GlobalIcon from 'src/assets/icons/global.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Switch } from 'src/components/buttons/Switch'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { SettingsBackButtonRow } from 'src/components/Settings/BackButtonRow'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { opacify } from 'src/utils/colors'
import { Screens } from './Screens'
import { useAccounts } from 'src/features/wallet/hooks'
import { AccountType } from 'src/features/wallet/accounts/types'

const ALERT_ICON_SIZE = 32

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
  const currentAccount = addressToAccount[address]
  const readonly = currentAccount.type === AccountType.Readonly
  const hasOnlyOneAccount = Object.values(addressToAccount).length === 1
  const navigation = useSettingsStackNavigation()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showRemoveWalletModal, setShowRemoveWalletModal] = useState(false)

  const onChangeNotificationSettings = (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.TogglePushNotificationParams,
        enabled,
        address,
      })
    )
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

  const sections: SettingsSection[] = [
    {
      subTitle: t('Wallet preferences'),
      data: [
        {
          screen: Screens.SettingsWalletEdit,
          text: t('Edit nickname or theme'),
          icon: <EditIcon color={theme.colors.neutralTextSecondary} strokeWidth="1.5" />,
          screenProps: { address },
        },
        {
          action: (
            <Switch value={notificationsEnabled} onValueChange={onChangeNotificationSettings} />
          ),
          text: t('Notifications'),
          icon: <NotificationIcon color={theme.colors.neutralTextSecondary} strokeWidth="1.5" />,
        },
        {
          screen: Screens.SettingsWalletManageConnection,
          text: t('Manage connections'),
          icon: <GlobalIcon color={theme.colors.neutralTextSecondary} strokeWidth="1.5" />,
          screenProps: { address },
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
        <SettingsBackButtonRow>
          <AddressDisplay
            address={address}
            showViewOnly={readonly}
            variant="largeLabel"
            verticalGap="none"
          />
        </SettingsBackButtonRow>
        <SectionList
          keyExtractor={(_item, index) => 'wallet_settings' + index}
          renderItem={renderItem}
          renderSectionHeader={({ section: { subTitle } }) => (
            <Box bg="mainBackground" pb="md">
              <Text color="neutralTextSecondary" fontWeight="500" variant="body1">
                {subTitle}
              </Text>
            </Box>
          )}
          sections={sections}
          showsVerticalScrollIndicator={false}
        />
      </Box>
      {!hasOnlyOneAccount && (
        <PrimaryButton
          label={t('Remove wallet')}
          style={{ backgroundColor: opacify(15, theme.colors.accentBackgroundFailure) }}
          textColor="accentBackgroundFailure"
          width="100%"
          onPress={() => setShowRemoveWalletModal(true)}
        />
      )}
      <BottomSheetModal
        backgroundColor={theme.colors.neutralSurface}
        isVisible={showRemoveWalletModal}
        name={ModalName.RemoveWallet}
        onClose={() => setShowRemoveWalletModal(false)}>
        <Flex centered gap="xl" px="md" py="lg">
          <Flex centered gap="xs">
            <AlertTriangle
              color={theme.colors.accentBackgroundWarning}
              height={ALERT_ICON_SIZE}
              width={ALERT_ICON_SIZE}
            />
            <Text mt="xs" variant="mediumLabel">
              {t('Are you sure?')}
            </Text>
            <Text color="neutralTextSecondary" textAlign="center" variant="body2">
              {t(
                'You’ll only be able to recover this wallet if you have backed it up. Removing your wallet will not permanently delete it or its contents.'
              )}
            </Text>
          </Flex>
          <Flex row mb="md">
            <PrimaryButton
              flex={1}
              label={t('Cancel')}
              style={{ backgroundColor: theme.colors.neutralContainer }}
              textColor="neutralTextPrimary"
              onPress={() => setShowRemoveWalletModal(false)}
            />
            <PrimaryButton
              flex={1}
              label={t('Remove')}
              style={{ backgroundColor: opacify(10, theme.colors.accentBackgroundFailure) }}
              textColor="accentBackgroundFailure"
              onPress={removeWallet}
            />
          </Flex>
        </Flex>
      </BottomSheetModal>
    </Screen>
  )
}
