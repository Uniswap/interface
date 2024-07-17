import { providers } from 'ethers'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, HapticFeedback, Separator, Skeleton, Text, isWeb } from 'ui/src'
import { SlashCircle } from 'ui/src/components/icons'
import { fonts } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { useCancelationGasFeeInfo, useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useSelectTransaction } from 'wallet/src/features/transactions/hooks'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import { TransactionDetails, TransactionStatus } from 'wallet/src/features/transactions/types'

export function CancelConfirmationView({
  authTrigger,
  onBack,
  onCancel,
  transactionDetails,
}: {
  authTrigger?: AuthTrigger
  onBack: () => void
  onCancel: (txRequest: providers.TransactionRequest) => void
  transactionDetails: TransactionDetails
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const cancelationGasFeeInfo = useCancelationGasFeeInfo(transactionDetails)
  const gasFeeUSD = useUSDValue(transactionDetails.chainId, cancelationGasFeeInfo?.cancelationGasFee)
  const gasFee = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const onCancelConfirm = useCallback(() => {
    if (!cancelationGasFeeInfo?.cancelRequest) {
      return
    }

    onCancel(cancelationGasFeeInfo.cancelRequest)
  }, [cancelationGasFeeInfo, onCancel])

  const onPressCancel = useCallback(async () => {
    await HapticFeedback.success()
    if (authTrigger) {
      await authTrigger({ successCallback: onCancelConfirm, failureCallback: () => {} })
    } else {
      onCancelConfirm()
    }
  }, [onCancelConfirm, authTrigger])

  // We don't currently support cancelling orders made from another device.
  const isRemoteOrder =
    useSelectTransaction(transactionDetails.from, transactionDetails.chainId, transactionDetails.id) === undefined &&
    isUniswapX(transactionDetails)

  const disableConfirmationButton =
    !cancelationGasFeeInfo?.cancelRequest || transactionDetails.status !== TransactionStatus.Pending || isRemoteOrder

  return (
    <Flex
      centered
      grow
      backgroundColor="$surface1"
      borderRadius="$rounded20"
      gap="$spacing16"
      mt={isWeb ? '$spacing16' : '$none'}
      px={isWeb ? '$none' : '$spacing24'}
      py={isWeb ? '$none' : '$spacing12'}
    >
      <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
        <SlashCircle color="$neutral2" size="$icon.20" />
      </Flex>
      <Flex centered gap="$spacing8">
        <Text variant="buttonLabel2">{t('transaction.action.cancel.title')}</Text>
        <Text color="$neutral2" textAlign="center" variant="body3">
          {t('transaction.action.cancel.description')}
        </Text>
      </Flex>
      <Flex width="100%">
        <Separator />
      </Flex>
      <Flex row justifyContent="space-between" pb="$spacing8" px="$spacing12" width="100%">
        <Text color="$neutral2" variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
        {!gasFeeUSD ? (
          <Skeleton>
            <FlexLoader borderRadius="$rounded4" height={fonts.body3.lineHeight} opacity={0.4} width="$spacing48" />
          </Skeleton>
        ) : (
          <Text variant="body3">{gasFee}</Text>
        )}
      </Flex>
      <Flex row gap="$spacing8" width="100%">
        <Button fill size="small" theme="tertiary" width="50%" onPress={onBack}>
          {t('common.button.back')}
        </Button>
        <Button
          fill
          disabled={disableConfirmationButton}
          size="small"
          testID={TestID.Cancel}
          theme="detrimental"
          width="50%"
          onPress={onPressCancel}
        >
          {t('common.button.confirm')}
        </Button>
      </Flex>
    </Flex>
  )
}
