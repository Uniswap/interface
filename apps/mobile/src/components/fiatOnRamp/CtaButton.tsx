import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, SpinningLoader } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons'

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
  const buttonAvailable = eligible || isLoading
  const continueText = eligible ? continueButtonText : t('fiatOnRamp.error.unsupported')
  return (
    <Button
      color={buttonAvailable ? '$white' : '$neutral2'}
      disabled={disabled}
      icon={
        isLoading ? (
          <SpinningLoader color="$sporeWhite" />
        ) : !eligible ? (
          <InfoCircleFilled color="$neutral3" />
        ) : undefined
      }
      size="large"
      theme={buttonAvailable ? 'primary' : 'tertiary'}
      onPress={onPress}
    >
      {!isLoading && continueText}
    </Button>
  )
}
