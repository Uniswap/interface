import { providers } from 'ethers'
import { notificationAsync } from 'expo-haptics'
import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useCancelationGasFeeInfo } from 'src/features/gas/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import SlashCircleIcon from 'ui/src/assets/icons/slash-circle.svg'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { TransactionDetails, TransactionStatus } from 'wallet/src/features/transactions/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

export function CancelConfirmationView({
  onBack,
  onCancel,
  transactionDetails,
}: {
  onBack: () => void
  onCancel: (txRequest: providers.TransactionRequest) => void
  transactionDetails: TransactionDetails
}): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const accountAddress = useActiveAccount()?.address

  const cancelationGasFeeInfo = useCancelationGasFeeInfo(transactionDetails)
  const gasFeeUSD = useUSDValue(
    transactionDetails.chainId,
    cancelationGasFeeInfo?.cancelationGasFee
  )
  const gasFee = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const onCancelConfirm = useCallback(() => {
    if (!cancelationGasFeeInfo?.cancelRequest) return

    onCancel(cancelationGasFeeInfo.cancelRequest)
  }, [cancelationGasFeeInfo, onCancel])

  const { trigger: actionButtonTrigger } = useBiometricPrompt(onCancelConfirm)
  const { requiredForTransactions } = useBiometricAppSettings()

  const onPressCancel = useCallback(async () => {
    await notificationAsync()
    if (requiredForTransactions) {
      await actionButtonTrigger()
    } else {
      onCancelConfirm()
    }
  }, [onCancelConfirm, requiredForTransactions, actionButtonTrigger])

  return (
    <Flex
      centered
      grow
      bg="$surface1"
      borderRadius="$rounded20"
      gap="$spacing24"
      p="$spacing24"
      pb="$spacing48">
      <Flex
        centered
        backgroundColor="$surface2"
        borderColor="$neutral2"
        borderRadius="$rounded12"
        p="$spacing12">
        <SlashCircleIcon color={colors.neutral2.get()} height={24} strokeWidth="1" width={24} />
      </Flex>
      <Flex centered gap="$spacing8">
        <Text variant="buttonLabel2">{t('Cancel this transaction?')}</Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t(
            'If you cancel this transaction before it’s processed by the network, you’ll pay a new network fee instead of the original one.'
          )}
        </Text>
      </Flex>
      <Flex
        bg="$surface2"
        borderBottomColor="$surface3"
        borderBottomWidth={1}
        borderRadius="$rounded16"
        width="100%">
        <Flex grow row justifyContent="space-between" p="$spacing12">
          <Text variant="subheading2">{t('Network cost')}</Text>
          {!gasFeeUSD ? <ActivityIndicator /> : <Text variant="subheading2">{gasFee}</Text>}
        </Flex>
        {accountAddress && (
          <Flex grow row justifyContent="space-between" p="$spacing12">
            <AddressDisplay
              hideAddressInSubtitle
              address={transactionDetails.from}
              horizontalGap="$spacing8"
              variant="subheading2"
            />
            <Text color="$neutral2" variant="subheading2">
              {shortenAddress(transactionDetails.from)}
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex grow row gap="$spacing8" px="$spacing4">
        <Button fill theme="tertiary" onPress={onBack}>
          {t('Back')}
        </Button>
        <Button
          fill
          disabled={transactionDetails.status !== TransactionStatus.Pending}
          testID={ElementName.Cancel}
          theme="detrimental"
          onPress={onPressCancel}>
          {t('Confirm')}
        </Button>
      </Flex>
    </Flex>
  )
}
