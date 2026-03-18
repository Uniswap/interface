import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWebPlatform } from 'utilities/src/platform'
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

  const nativeCurrencySymbol = nativeOnChain(chainId).symbol

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const disableReviewButton = !!warnings.blockingWarning || disabled

  const buttonText = insufficientGasFunds
    ? t('send.warning.insufficientFunds.title', {
        currencySymbol: nativeCurrencySymbol ?? '',
      })
    : t('common.button.review')

  return (
    <Flex row alignSelf="stretch" gap="$spacing16">
      <Trace logPress element={ElementName.SendReview}>
        <Button
          variant="branded"
          isDisabled={disableReviewButton}
          size={isWebPlatform ? 'medium' : 'large'}
          testID={TestID.SendReview}
          onPress={onPress}
        >
          {buttonText}
        </Button>
      </Trace>
    </Flex>
  )
}
