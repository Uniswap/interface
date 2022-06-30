import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import Scan from 'src/assets/icons/qr-simple.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { ArrowIcon } from 'src/components/icons/ArrowIcon'
import { OverlayGroup } from 'src/components/icons/OverlayIcon'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { Screens } from 'src/screens/Screens'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const address = activeAccount?.address

  const { sessions } = useWalletConnect(address)

  const onPressScan = () => {
    selectionAsync()
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: WalletConnectModalState.WalletQr,
      })
    )
  }
  const onPressSettings = () => {
    selectionAsync()
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }

  const onPressSessions = () => {
    if (address) {
      navigation.navigate(Screens.SettingsWalletManageConnection, { address })
    }
  }

  if (!activeAccount || !address)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <Text>todo blank state</Text>
        </Box>
      </Screen>
    )

  return (
    <Screen>
      <GradientBackground opacity={1}>
        <BlueToDarkRadial />
      </GradientBackground>
      <Flex gap="lg" mt="sm" px="md">
        {/* nav header */}
        <Flex row justifyContent="space-between">
          <Text variant="headlineSmall">{t('Activity')}</Text>
          <Flex centered row gap="md">
            {isWalletConnectSupportedAccount(activeAccount) && (
              <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
                <Scan color={theme.colors.textSecondary} height={24} width={24} />
              </Button>
            )}
            <Button name={ElementName.Settings} onPress={onPressSettings}>
              <Settings color={theme.colors.textSecondary} height={24} width={24} />
            </Button>
          </Flex>
        </Flex>
        {/* profile info */}
        <Flex centered gap="sm" my="lg">
          <AddressDisplay
            address={address}
            captionVariant="mediumLabel"
            direction="column"
            showAddressAsSubtitle={true}
            showCopy={true}
            size={48}
            variant="headlineMedium"
          />
        </Flex>
        {sessions.length > 0 && <SessionsButton sessions={sessions} onPress={onPressSessions} />}
      </Flex>
    </Screen>
  )
}

function SessionsButton({
  sessions,
  onPress,
}: {
  sessions: WalletConnectSession[]
  onPress: () => void
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const sessionIcons = sessions.map((session) => {
    return (
      <RemoteImage
        borderRadius={theme.borderRadii.none}
        height={32}
        uri={session.dapp.icon}
        width={32}
      />
    )
  })

  return (
    <Button
      backgroundColor="translucentBackground"
      borderRadius="lg"
      px="md"
      py="sm"
      onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="sm">
          <OverlayGroup iconSize={32} icons={sessionIcons} />
          <Text variant="mediumLabel">{sessions.length + ' ' + t('sites connected')}</Text>
        </Flex>
        <ArrowIcon size={18} />
      </Flex>
    </Button>
  )
}
