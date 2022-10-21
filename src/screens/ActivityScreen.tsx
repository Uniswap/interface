import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import SessionsButton from 'src/components/WalletConnect/SessionsButton'
import { setNotificationStatus } from 'src/features/notifications/notificationSlice'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Screens } from 'src/screens/Screens'

const MAX_SCROLL_HEIGHT = 180

export function ActivityScreen({ route }: AppStackScreenProp<Screens.Activity>) {
  const { preloadedQuery } = route.params

  const dispatch = useAppDispatch()
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()
  const { address, type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const { sessions } = useWalletConnect(address)

  const onPressSessions = useCallback(() => {
    if (address) {
      navigation.navigate(Screens.SettingsWalletManageConnection, { address })
    }
  }, [address, navigation])

  useEffect(() => {
    dispatch(setNotificationStatus({ address, hasNotifications: false }))
  }, [dispatch, address])

  return (
    <HeaderScrollScreen
      contentHeader={
        <BackHeader p="md">
          <Text variant="buttonLabelMedium">{t('Activity')}</Text>
        </BackHeader>
      }
      fixedHeader={
        <Flex centered>
          <AddressDisplay address={address} variant="subheadLarge" />
        </Flex>
      }
      maxScrollHeightOverride={MAX_SCROLL_HEIGHT}>
      {sessions.length > 0 && (
        <Flex px="sm">
          <SessionsButton sessions={sessions} onPress={onPressSessions} />
        </Flex>
      )}
      <Flex pb="lg" px="sm">
        <TransactionList
          emptyStateContent={
            <Flex centered gap="xxl" mt="xl" mx="xl">
              <Text variant="subheadLarge">{t('No activity yet')}</Text>
              <Text color="textSecondary" variant="bodySmall">
                {t(
                  'When you make transactions or interact with sites, details of your activity will appear here.'
                )}
              </Text>
            </Flex>
          }
          ownerAddress={address}
          preloadedQuery={preloadedQuery}
          readonly={readonly}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}
