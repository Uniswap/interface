import React from 'react'
import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import Trace from 'src/components/Trace/Trace'
import { ElementName, MobileEventName } from 'src/features/telemetry/constants'
import { Button, Icons } from 'ui/src'

interface FiatOnRampCtaButtonProps {
  onPress: () => void
  isLoading: boolean
  eligible: boolean
  disabled: boolean
  analyticsProperties: Record<string, unknown>
  continueButtonText: string
}

export function FiatOnRampCtaButton({
  continueButtonText,
  isLoading,
  eligible,
  disabled,
  analyticsProperties,
  onPress,
}: FiatOnRampCtaButtonProps): JSX.Element {
  const { t } = useTranslation()
  const buttonAvailable = eligible || isLoading
  const continueText = eligible ? continueButtonText : t('Not supported in region')
  return (
    <Trace
      logPress
      element={ElementName.FiatOnRampWidgetButton}
      pressEvent={MobileEventName.FiatOnRampWidgetOpened}
      properties={analyticsProperties}>
      <Button
        color={buttonAvailable ? '$white' : '$neutral2'}
        disabled={disabled}
        icon={
          isLoading ? (
            <SpinningLoader color="$sporeWhite" />
          ) : !eligible ? (
            <Icons.InfoCircleFilled color="$neutral3" />
          ) : undefined
        }
        size="large"
        theme={buttonAvailable ? 'primary' : 'tertiary'}
        onPress={onPress}>
        {!isLoading && continueText}
      </Button>
    </Trace>
  )
}
