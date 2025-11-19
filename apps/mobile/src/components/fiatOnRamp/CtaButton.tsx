import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, SpinningLoader, useIsShortMobileDevice } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

interface FiatOnRampCtaButtonProps {
  onPress: () => void
  isLoading?: boolean
  eligible: boolean
  disabled: boolean
  continueButtonText: string
}

export function FiatOnRampCtaButton({
  continueButtonText,
  isLoading,
  eligible,
  disabled,
  onPress,
}: FiatOnRampCtaButtonProps): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()
  const buttonAvailable = eligible || isLoading
  const continueText = eligible ? continueButtonText : t('fiatOnRamp.error.unsupported')
  return (
    <Button
      isDisabled={disabled}
      icon={
        isLoading ? <SpinningLoader color="$white" /> : !eligible ? <InfoCircleFilled color="$neutral3" /> : undefined
      }
      iconPosition="after"
      size={isShortMobileDevice ? 'small' : 'large'}
      emphasis={isLoading ? 'secondary' : buttonAvailable ? 'primary' : 'secondary'}
      loading={isLoading}
      variant="branded"
      onPress={onPress}
    >
      {!isLoading && continueText}
    </Button>
  )
}
