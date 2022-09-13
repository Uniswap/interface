import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AppBackground } from 'src/components/gradients/AppBackground'
import { Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import SessionsButton from 'src/components/WalletConnect/SessionsButton'
import { openModal } from 'src/features/modals/modalSlice'
import { clearNotificationCount } from 'src/features/notifications/notificationSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Screens } from 'src/screens/Screens'

const MAX_SCROLL_HEIGHT = 180

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeAccount = useActiveAccountWithThrow()
  const address = activeAccount.address

  const { sessions } = useWalletConnect(address)

  const onPressScan = useCallback(() => {
    selectionAsync()
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: ScannerModalState.WalletQr,
      })
    )
  }, [dispatch])

  const onPressSessions = useCallback(() => {
    if (address) {
      navigation.navigate(Screens.SettingsWalletManageConnection, { address })
    }
  }, [address, navigation])

  useEffect(() => {
    dispatch(clearNotificationCount({ address }))
  }, [dispatch, address])

  const ContentHeader = useMemo(
    () => (
      <Flex row alignItems="center" justifyContent="space-between" p="md">
        <BackButton size={theme.iconSizes.lg} />
        <Text variant="mediumLabel">{t('Activity')}</Text>
        <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
          <ScanQRIcon color={theme.colors.textSecondary} height={24} width={24} />
        </Button>
      </Flex>
    ),
    [onPressScan, t, theme.colors.textSecondary, theme.iconSizes.lg]
  )

  return (
    <HeaderScrollScreen
      background={<AppBackground />}
      contentHeader={ContentHeader}
      fixedHeader={
        <Flex centered>
          <AddressDisplay address={address} variant="subhead" />
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
          address={address}
          emptyStateContent={
            <Flex centered gap="xxl" mt="xl" mx="xl">
              <Flex centered gap="xs">
                <Text variant="subhead">{t('No activity yet')}</Text>
                <Text color="textSecondary" variant="bodySmall">
                  {t(
                    'When you make transactions or interact with sites, details of your activity will appear here.'
                  )}
                </Text>
              </Flex>
              <Flex row>
                {/* TODO: Add a buy button when fiat OR is implemented */}
                <PrimaryButton
                  borderRadius="md"
                  icon={<ScanQRIcon color={theme.colors.textPrimary} height={20} width={20} />}
                  label={t('Receive')}
                  variant="transparent"
                  onPress={onPressScan}
                />
              </Flex>
            </Flex>
          }
          readonly={false}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}
