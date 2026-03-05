import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { deleteCloudStorageMnemonicBackup } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { Button, Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { Account, BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { selectAndroidCloudBackupEmail } from 'wallet/src/features/wallet/selectors'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsCloudBackupStatus>

export function SettingsCloudBackupStatus({
  navigation,
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()
  const dispatch = useDispatch()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const accounts = useAccounts()
  const mnemonicId = (accounts[address] as SignerMnemonicAccount).mnemonicId
  const androidCloudBackupEmail = useSelector(selectAndroidCloudBackupEmail)
  const associatedAccounts = Object.values(accounts).filter(
    (a) => a.type === AccountType.SignerMnemonic && a.mnemonicId === mnemonicId,
  )

  // Fetch balance data for associated accounts
  const accountAddresses = useMemo(() => associatedAccounts.map((account) => account.address), [associatedAccounts])
  const { data: accountBalanceData, loading } = useAccountListData({
    addresses: accountAddresses,
  })

  // Create balance mapping
  const balanceRecord: Record<string, number> = useMemo(() => {
    if (!accountBalanceData?.portfolios) {
      return {}
    }
    return Object.fromEntries(
      accountBalanceData.portfolios
        .filter((portfolio): portfolio is NonNullable<typeof portfolio> => Boolean(portfolio))
        .map((portfolio) => [portfolio.ownerAddress, portfolio.tokensTotalDenominatedValue?.value ?? 0]),
    )
  }, [accountBalanceData])

  const [showBackupDeleteWarning, setShowBackupDeleteWarning] = useState(false)
  const onConfirmDeleteBackup = async (): Promise<void> => {
    if (requiredForTransactions) {
      await biometricTrigger()
    } else {
      await deleteBackup()
    }
  }

  const deleteBackup = async (): Promise<void> => {
    try {
      if (!mnemonicId) {
        throw new Error('Mnemonic ID is required')
      }
      await deleteCloudStorageMnemonicBackup(mnemonicId)
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.RemoveBackupMethod,
          address,
          backupMethod: BackupType.Cloud,
        }),
      )
      setShowBackupDeleteWarning(false)
      navigation.goBack()
    } catch (error) {
      setShowBackupDeleteWarning(false)
      logger.error(error, { tags: { file: 'SettingsCloudBackupStatus', function: 'deleteBackup' } })

      Alert.alert(
        t('settings.setting.backup.error.title', { cloudProviderName: getCloudProviderName() }),
        t('settings.setting.backup.error.message.short'),
        [{ text: t('common.button.ok'), style: 'default' }],
      )
    }
  }

  const { requiredForTransactions } = useBiometricAppSettings()
  const { trigger: biometricTrigger } = useBiometricPrompt(deleteBackup)

  const onPressBack = (): void => {
    navigation.goBack()
  }

  const renderItem = ({ item, index }: { item: Account; index: number }): JSX.Element => {
    const balance = balanceRecord[item.address] ?? 0
    const formattedBalance = convertFiatAmountFormatted(balance, NumberType.PortfolioBalance)

    return (
      <Flex row justifyContent="space-between" pt="$spacing8" pb="$spacing4">
        <AddressDisplay
          key={`${index}-${item.address}`}
          address={item.address}
          size={36}
          variant="subheading2"
          captionVariant="body3"
          alignItems="center"
        />
        <Text color="$neutral2" variant="body3" loading={loading}>
          {formattedBalance}
        </Text>
      </Flex>
    )
  }

  const fullScreenContentHeight = (dimensions.fullHeight - insets.top - insets.bottom - spacing.spacing36) / 2

  return (
    <Screen mx="$spacing16" my="$spacing16">
      <BackHeader alignment="center" mb="$spacing16" onPressBack={onPressBack}>
        <Text variant="body1">
          {t('settings.setting.backup.status.title', { cloudProviderName: getCloudProviderName() })}
        </Text>
      </BackHeader>

      <Flex grow alignItems="stretch" justifyContent="space-evenly" mt="$spacing16" mx="$spacing8">
        <Flex grow gap="$spacing24" justifyContent="flex-start">
          <Text color="$neutral2" variant="body2">
            {t('settings.setting.backup.status.description', {
              cloudProviderName: getCloudProviderName(),
            })}
          </Text>
          <Flex row justifyContent="space-between">
            <Text flexShrink={1} variant="body1">
              {t('settings.setting.backup.recoveryPhrase.label')}
            </Text>
            <Flex alignItems="flex-end" flexGrow={1} gap="$spacing4">
              <Flex row alignItems="center" gap="$spacing12" justifyContent="space-around">
                <Text color="$neutral2" variant="buttonLabel3">
                  {t('settings.setting.backup.status.recoveryPhrase.backed')}
                </Text>

                {/* @TODO: [MOB-249] Add non-backed up state once we have more options on this page  */}
                <Check color="$statusSuccess" size="$icon.24" />
              </Flex>
              {androidCloudBackupEmail && (
                <Text color="$neutral3" variant="buttonLabel3">
                  {androidCloudBackupEmail}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex row centered>
          <Button
            testID={TestID.Remove}
            size="large"
            emphasis="secondary"
            variant="critical"
            onPress={(): void => {
              setShowBackupDeleteWarning(true)
            }}
          >
            {t('settings.setting.backup.status.action.delete')}
          </Button>
        </Flex>
      </Flex>

      <WarningModal
        caption={t('settings.setting.backup.delete.warning', {
          cloudProviderName: getCloudProviderName(),
        })}
        rejectText={t('common.button.close')}
        acknowledgeText={t('common.button.delete')}
        acknowledgeButtonVariant="critical"
        isOpen={showBackupDeleteWarning}
        modalName={ModalName.ViewSeedPhraseWarning}
        title={t('settings.setting.backup.delete.confirm.title')}
        severity={WarningSeverity.High}
        onClose={(): void => {
          setShowBackupDeleteWarning(false)
        }}
        onAcknowledge={onConfirmDeleteBackup}
      >
        {associatedAccounts.length > 1 && (
          <Flex shrink gap="$spacing12" pt="$spacing12">
            <Text textAlign="left" variant="body3" color="$statusCritical">
              {t('settings.setting.backup.delete.confirm.message')}
            </Text>
            <Flex maxHeight={fullScreenContentHeight}>
              <FlatList
                style={{ flexGrow: 0 }}
                data={associatedAccounts}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${index}-${item.address}`}
              />
            </Flex>
          </Flex>
        )}
      </WarningModal>
    </Screen>
  )
}
