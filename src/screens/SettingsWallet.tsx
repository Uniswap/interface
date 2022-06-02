import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '@shopify/restyle'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, ListRenderItemInfo, Alert } from 'react-native'
import { SettingsStackParamList, useSettingsStackNavigation } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import {
  SettingsSection,
  SettingsRow,
  SettingsSectionItem,
  SettingsSectionItemComponent,
} from 'src/components/Settings/SettingsRow'
import { Text } from 'src/components/Text'
import { Screens } from './Screens'
import NotificationIcon from 'src/assets/icons/bell.svg'
import { Switch } from 'src/components/buttons/Switch'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { useAppDispatch } from 'src/app/hooks'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWallet>

export function SettingsWallet({
  route: {
    params: { address },
  },
}: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useSettingsStackNavigation()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const handleNotificationSettingsChanged = (enable: boolean) => {
    dispatch(
      editAccountActions.trigger({
        type: enable
          ? EditAccountAction.EnablePushNotification
          : EditAccountAction.DisablePushNotification,
        address,
      })
    )
  }

  const onChangeNotificationSettings = (val: boolean) => {
    setNotificationsEnabled(val)
    if (val) {
      Alert.alert('Uniswap Wallet would like to send you notifications.', '', [
        {
          text: "Don't Allow",
          onPress: () => setNotificationsEnabled(false),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => handleNotificationSettingsChanged(true),
        },
      ])
    } else {
      handleNotificationSettingsChanged(false)
    }
  }

  const sections: SettingsSection[] = [
    {
      subTitle: t('Wallet preferences'),
      data: [
        {
          action: (
            <Switch value={notificationsEnabled} onValueChange={onChangeNotificationSettings} />
          ),
          text: t('Notifications'),
          icon: <NotificationIcon color={theme.colors.neutralTextSecondary} strokeWidth="1.5" />,
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
    return <SettingsRow key={item.screen} navigation={navigation} page={item} theme={theme} />
  }

  return (
    <Screen px="lg" py="sm">
      <Box alignItems="center" flexDirection="row" mb="lg">
        <BackButton mr="md" />
        <AddressDisplay address={address} variant="body1" verticalGap="none" />
      </Box>
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
    </Screen>
  )
}
