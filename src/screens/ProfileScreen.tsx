import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import Scan from 'src/assets/icons/qr-simple.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { HeaderSectionListScreen } from 'src/components/layout/screens/HeaderSectionListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import SessionsButton from 'src/components/WalletConnect/SessionsButton'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useAllFormattedTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Screens } from 'src/screens/Screens'
import { spacing } from 'src/styles/sizing'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

const key = (info: TransactionSummaryInfo) => info.hash

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const address = useMemo(() => activeAccount?.address, [activeAccount])
  const { sessions } = useWalletConnect(address)
  const { todayTransactionList, weekTransactionList, beforeCurrentWeekTransactionList } =
    useAllFormattedTransactions(address)

  const sectionData = useMemo(() => {
    return [
      ...(todayTransactionList.length > 0
        ? [{ title: t('Today'), data: todayTransactionList }]
        : []),
      ...(weekTransactionList.length > 0
        ? [{ title: t('This Week'), data: weekTransactionList }]
        : []),
      ...(beforeCurrentWeekTransactionList.length > 0
        ? [{ title: t('All'), data: beforeCurrentWeekTransactionList }]
        : []),
    ]
  }, [beforeCurrentWeekTransactionList, t, todayTransactionList, weekTransactionList])

  const onPressScan = useCallback(() => {
    selectionAsync()
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: WalletConnectModalState.WalletQr,
      })
    )
  }, [dispatch])

  const onPressSettings = useCallback(() => {
    selectionAsync()
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }, [navigation])

  const onPressSessions = useCallback(() => {
    if (address) {
      navigation.navigate(Screens.SettingsWalletManageConnection, { address })
    }
  }, [address, navigation])

  if (!activeAccount || !address) {
    return <Text>Loading To Do</Text>
  }

  const ContentHeader = (
    <Flex gap="lg" my="sm">
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
  )

  const renderItem = (item: ListRenderItemInfo<TransactionSummaryInfo>) => {
    return <TransactionSummaryItem {...item.item} />
  }

  return (
    <HeaderSectionListScreen
      ItemSeparatorComponent={() => <Separator px="md" />}
      ListHeaderComponent={ContentHeader}
      contentContainerStyle={ContainerStyle.base}
      fixedHeader={
        <Flex row alignItems="center" justifyContent="space-between">
          <Text variant="subhead">{t('Activity')}</Text>
          <Box width={18} />
        </Flex>
      }
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={({ section: { title } }) => (
        <Box bg="mainBackground" px="xs" py="md">
          <Text color="textSecondary" variant="smallLabel">
            {title}
          </Text>
        </Box>
      )}
      sections={sectionData}
    />
  )
}

const ContainerStyle = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
  },
})
