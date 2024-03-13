import React from 'react'
import { useTranslation } from 'react-i18next'
import Trace from 'src/components/Trace/Trace'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Button, Icons } from 'ui/src'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { ElementName } from 'wallet/src/telemetry/constants'

interface FiatOnRampCtaButtonProps {
  onPress: () => void
  isLoading?: boolean
  eligible: boolean
  disabled: boolean
  analyticsProperties?: Record<string, unknown>
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
  const continueText = eligible ? continueButtonText : t('fiatOnRamp.error.unsupported')
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
