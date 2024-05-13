import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'

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
      // TODO: remove when https://linear.app/uniswap/issue/MOB-3182/disabled-ui-on-enabled-button is fixed
      key={Math.random()}
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
      onPress={onPress}>
      {!isLoading && continueText}
    </Button>
  )
}
