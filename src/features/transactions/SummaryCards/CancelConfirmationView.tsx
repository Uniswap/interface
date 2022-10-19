import { providers } from 'ethers'
import { ComponentProps, default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import ActionButton from 'src/components/buttons/ActionButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useCancelationGasFeeInfo, useUSDGasPrice } from 'src/features/gas/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionDetails } from 'src/features/transactions/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'
import { formatUSDGasPrice } from 'src/utils/format'

const spacerProps: ComponentProps<typeof Box> = {
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
}) {
  const { t } = useTranslation()
  const accountAddress = useActiveAccount()?.address

  const cancelationGasFeeInfo = useCancelationGasFeeInfo(transactionDetails)
  const gasFeeUSD = formatUSDGasPrice(
    useUSDGasPrice(transactionDetails.chainId, cancelationGasFeeInfo?.cancelationGasFee)
  )

  const onCancelConfirm = useCallback(() => {
    if (!cancelationGasFeeInfo?.cancelRequest) return

    onCancel(cancelationGasFeeInfo.cancelRequest)
  }, [cancelationGasFeeInfo, onCancel])

  return (
    <Flex centered grow bg="backgroundSurface" borderRadius="xl" gap="lg" p="lg" pb="xxl">
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
      <Flex
        bg="backgroundContainer"
        borderRadius="xl"
        gap="none"
        spacerProps={spacerProps}
        width="100%">
        <Flex grow row justifyContent="space-between" p="md">
          <Text variant="bodySmall">{t('Network fee')}</Text>
          {!gasFeeUSD ? <ActivityIndicator /> : <Text variant="bodySmall">{gasFeeUSD}</Text>}
        </Flex>
        {accountAddress && (
          <Flex grow row justifyContent="space-between" padding="md">
            <AddressDisplay address={transactionDetails.from} />
            <Text color="textSecondary" variant="bodySmall">
              {shortenAddress(transactionDetails.from)}
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex grow row gap="xs" px="xxs">
        <PrimaryButton
          flex={1}
          flexBasis="50%"
          label="Back"
          variant="transparent"
          onPress={onBack}
        />
        <Flex flex={1} flexBasis="50%">
          <ActionButton
            disabled={false}
            label={t('Confirm')}
            name={ElementName.Cancel}
            textVariant="buttonLabelMedium"
            onPress={onCancelConfirm}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
