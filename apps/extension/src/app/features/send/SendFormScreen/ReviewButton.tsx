import { useTranslation } from 'react-i18next'
import { Button, Flex, isWeb } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

type ReviewButtonProps = {
  onPress: () => void
  disabled?: boolean
}

export function ReviewButton({ onPress, disabled }: ReviewButtonProps): JSX.Element {
  const { t } = useTranslation()

  const {
    warnings,
    derivedSendInfo: { chainId },
  } = useSendContext()

  const nativeCurrencySymbol = NativeCurrency.onChain(chainId).symbol

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const disableReviewButton = !!warnings.blockingWarning || disabled

  const buttonText = insufficientGasFunds
    ? t('send.warning.insufficientFunds.title', {
        currencySymbol: nativeCurrencySymbol,
      })
    : t('common.button.review')

  return (
    <Flex row alignSelf="stretch" gap="$spacing16">
      <Trace logPress element={ElementName.SendReview}>
        <Button
          variant="branded"
          isDisabled={disableReviewButton}
          size={isWeb ? 'medium' : 'large'}
          testID={TestID.SendReview}
          onPress={onPress}
        >
          {buttonText}
        </Button>
      </Trace>
    </Flex>
  )
}
