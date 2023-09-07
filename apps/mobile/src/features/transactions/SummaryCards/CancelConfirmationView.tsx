import { providers } from 'ethers'
import { notificationAsync } from 'expo-haptics'
import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { BoxProps, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useCancelationGasFeeInfo } from 'src/features/gas/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import SlashCircleIcon from 'ui/src/assets/icons/slash-circle.svg'
import { theme } from 'ui/src/theme/restyle'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { TransactionDetails, TransactionStatus } from 'wallet/src/features/transactions/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

const spacerProps: BoxProps = {
  borderBottomColor: 'surface3',
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
      bg="surface2"
      borderRadius="rounded20"
      gap="spacing24"
      p="spacing24"
      pb="spacing48">
      <Flex
        centered
        backgroundColor="surface2"
        borderColor="neutral2"
        borderRadius="rounded12"
        padding="spacing12">
        <SlashCircleIcon color={theme.colors.neutral2} height={24} strokeWidth="1" width={24} />
      </Flex>
      <Flex centered gap="spacing8">
        <Text variant="buttonLabelMedium">{t('Cancel this transaction?')}</Text>
        <Text color="neutral2" textAlign="center" variant="bodySmall">
          {t(
            'If you cancel this transaction before it’s processed by the network, you’ll pay a new network fee instead of the original one.'
          )}
        </Text>
      </Flex>
      <Flex
        bg="surface2"
        borderRadius="rounded16"
        gap="none"
        spacerProps={spacerProps}
        width="100%">
        <Flex grow row justifyContent="space-between" p="spacing12">
          <Text variant="subheadSmall">{t('Network fee')}</Text>
          {!gasFeeUSD ? <ActivityIndicator /> : <Text variant="subheadSmall">{gasFeeUSD}</Text>}
        </Flex>
        {accountAddress && (
          <Flex grow row justifyContent="space-between" padding="spacing12">
            <AddressDisplay
              hideAddressInSubtitle
              address={transactionDetails.from}
              horizontalGap="$spacing8"
              variant="subheadSmall"
            />
            <Text color="neutral2" variant="subheadSmall">
              {shortenAddress(transactionDetails.from)}
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex grow row gap="spacing8" px="spacing4">
        <Button fill emphasis={ButtonEmphasis.Tertiary} label={t('Back')} onPress={onBack} />
        <Button
          fill
          disabled={transactionDetails.status !== TransactionStatus.Pending}
          emphasis={ButtonEmphasis.Detrimental}
          label={t('Confirm')}
          testID={ElementName.Cancel}
          onPress={onPressCancel}
        />
      </Flex>
    </Flex>
  )
}
