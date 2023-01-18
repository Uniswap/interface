import { providers } from 'ethers'
import { notificationAsync } from 'expo-haptics'
import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { BoxProps, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useCancelationGasFeeInfo, useUSDValue } from 'src/features/gas/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'
import { formatUSDPrice, NumberType } from 'src/utils/format'

const spacerProps: BoxProps = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 1,
}

export function CancelConfirmationView({
  onBack,
  onCancel,
  transactionDetails,
}: {
  onBack: () => void
  onCancel: (txRequest: providers.TransactionRequest) => void
  transactionDetails: TransactionDetails
}): JSX.Element {
  const { t } = useTranslation()
  const accountAddress = useActiveAccount()?.address

  const cancelationGasFeeInfo = useCancelationGasFeeInfo(transactionDetails)
  const gasFeeUSD = formatUSDPrice(
    useUSDValue(transactionDetails.chainId, cancelationGasFeeInfo?.cancelationGasFee),
    NumberType.FiatGasPrice
  )

  const onCancelConfirm = useCallback(() => {
    if (!cancelationGasFeeInfo?.cancelRequest) return

    onCancel(cancelationGasFeeInfo.cancelRequest)
  }, [cancelationGasFeeInfo, onCancel])

  const { trigger: actionButtonTrigger } = useBiometricPrompt(onCancelConfirm)
  const { requiredForTransactions } = useBiometricAppSettings()

  const onPressCancel = useCallback(() => {
    notificationAsync()
    if (requiredForTransactions) {
      actionButtonTrigger()
    } else {
      onCancelConfirm()
    }
  }, [onCancelConfirm, requiredForTransactions, actionButtonTrigger])

  return (
    <Flex centered grow bg="background1" borderRadius="xl" gap="lg" p="lg" pb="xxl">
      <Flex centered borderColor="textSecondary" borderRadius="md" borderWidth={1} padding="xs">
        <SlashCircleIcon fill="none" height={24} />
      </Flex>
      <Flex centered gap="xs">
        <Text variant="buttonLabelMedium">{t('Cancel this transaction?')}</Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {t(
            'If you cancel this transaction before it’s processed by the network, you’ll pay a new network fee instead of the original one.'
          )}
        </Text>
      </Flex>
      <Flex bg="background2" borderRadius="xl" gap="none" spacerProps={spacerProps} width="100%">
        <Flex grow row justifyContent="space-between" p="md">
          <Text variant="bodySmall">{t('Network fee')}</Text>
          {!gasFeeUSD ? <ActivityIndicator /> : <Text variant="bodySmall">{gasFeeUSD}</Text>}
        </Flex>
        {accountAddress && (
          <Flex grow row justifyContent="space-between" padding="md">
            <AddressDisplay hideAddressInSubtitle address={transactionDetails.from} />
            <Text color="textSecondary" variant="bodySmall">
              {shortenAddress(transactionDetails.from)}
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex grow row gap="xs" px="xxs">
        <Button fill emphasis={ButtonEmphasis.Tertiary} label={t('Back')} onPress={onBack} />
        <Button
          fill
          disabled={transactionDetails.status !== TransactionStatus.Pending}
          emphasis={ButtonEmphasis.Detrimental}
          label={t('Confirm')}
          name={ElementName.Cancel}
          onPress={onPressCancel}
        />
      </Flex>
    </Flex>
  )
}
