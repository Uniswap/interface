import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList, useSettingsStackNavigation } from 'src/app/navigation/types'
import NotificationIcon from 'src/assets/icons/bell.svg'
import EditIcon from 'src/assets/icons/edit.svg'
import GlobalIcon from 'src/assets/icons/global.svg'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Switch } from 'src/components/buttons/Switch'
import { BackButtonRow } from 'src/components/layout/BackButtonRow'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import {
  SettingsRow,
  SettingsSection,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { AccountType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts } from 'src/features/wallet/hooks'
import { opacify } from 'src/utils/colors'
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

  const cancelWalletRemove = () => {
    setShowRemoveWalletModal(false)
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
            <Switch value={notificationsEnabled} onValueChange={onChangeNotificationSettings} />
          ),
          text: t('Notifications'),
          icon: <NotificationIcon color={theme.colors.textSecondary} />,
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
        <BackButtonRow>
          <AddressDisplay
            address={address}
            showViewOnly={readonly}
            variant="subhead"
            verticalGap="none"
          />
        </BackButtonRow>
        <SectionList
          keyExtractor={(_item, index) => 'wallet_settings' + index}
          renderItem={renderItem}
          renderSectionHeader={({ section: { subTitle } }) => (
            <Box bg="mainBackground" pb="md">
              <Text color="textSecondary" fontWeight="500" variant="body">
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
          style={{ backgroundColor: opacify(15, theme.colors.accentFailure) }}
          textColor="accentFailure"
          width="100%"
          onPress={() => setShowRemoveWalletModal(true)}
        />
      )}

      {!!showRemoveWalletModal && (
        <RemoveAccountModal onCancel={cancelWalletRemove} onConfirm={removeWallet} />
      )}
    </Screen>
  )
}
