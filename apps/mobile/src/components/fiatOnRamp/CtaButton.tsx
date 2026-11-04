import { Button, useIsShortMobileDevice, SpinningLoader } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import React from 'react'
import { useTranslation } from 'react-i18next'

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
      disabled={disabled}
      icon={
        isLoading ? <SpinningLoader color="$white" /> : !eligible ? <InfoCircleFilled color="$neutral3" /> : undefined
      }
      iconPosition="after"
      size={isShortMobileDevice ? 'medium' : 'large'}
      emphasis={isLoading ? 'secondary' : buttonAvailable ? 'primary' : 'secondary'}
      loading={isLoading}
      variant="branded"
      onPress={onPress}
    >
      {!isLoading && continueText}
    </Button>
  )
}
