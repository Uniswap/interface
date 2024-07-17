import { useTranslation } from 'react-i18next'
import { useTransferContext } from 'src/app/features/transfer/TransferContext'
import { Button, Flex, Text, isWeb } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { WarningLabel } from 'wallet/src/features/transactions/WarningModal/types'

type ReviewButtonProps = {
  onPress: () => void
  disabled?: boolean
}

export function ReviewButton({ onPress, disabled }: ReviewButtonProps): JSX.Element {
  const { t } = useTranslation()

  const {
    warnings,
    derivedTransferInfo: { chainId },
  } = useTransferContext()

  const nativeCurrencySymbol = NativeCurrency.onChain(chainId).symbol

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const disableReviewButton = !!warnings.blockingWarning || disabled

  const buttonText = insufficientGasFunds
    ? t('send.warning.insufficientFunds.title', {
        currencySymbol: nativeCurrencySymbol,
      })
    : t('common.button.review')

  return (
    <Flex gap="$spacing16">
      <Trace logPress element={ElementName.SendReview}>
        <Button
          backgroundColor="$accent1"
          disabled={disableReviewButton}
          size={isWeb ? 'medium' : 'large'}
          testID={TestID.SendReview}
          onPress={onPress}
        >
          <Text color="white" variant="buttonLabel1">
            {buttonText}
          </Text>
        </Button>
      </Trace>
    </Flex>
  )
}
