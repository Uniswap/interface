import { SharedEventName } from '@uniswap/analytics-events'
import { useState } from 'react'
import { Flex, GeneratedIcon, InlineCard, LabeledCheckbox, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIcon, getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants/trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

type InlineWarningCardProps = {
  severity: WarningSeverity
  heading?: string
  description: string
  heroIcon?: boolean
  checkboxLabel?: string
  onPressCtaButton?: () => void
  checked?: boolean
  setChecked?: (checked: boolean) => void
  hideCtaIcon?: boolean
  headingTestId?: string
  descriptionTestId?: string
  analyticsProperties?: Record<string, unknown>
  Icon?: GeneratedIcon
}

export function InlineWarningCard({
  severity,
  heading,
  description,
  checkboxLabel,
  heroIcon,
  onPressCtaButton,
  checked,
  setChecked,
  hideCtaIcon,
  headingTestId,
  descriptionTestId,
  analyticsProperties,
  Icon,
}: InlineWarningCardProps): JSX.Element | null {
  const [checkedFallback, setCheckedFallback] = useState(false)
  const { color, textColor, backgroundColor } = getWarningIconColors(severity)
  const WarningIcon = getWarningIcon(severity)
  const shouldShowCtaIcon = !hideCtaIcon && severity !== WarningSeverity.Low && severity !== WarningSeverity.None
  const trace = useTrace()

  const onCheckPressed = (isChecked: boolean): void => {
    if (setChecked) {
      setChecked(!isChecked)
    } else {
      setCheckedFallback(!isChecked)
    }

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      ...analyticsProperties,
      checked: !isChecked,
      element: ElementName.InlineWarningCardCheckbox,
    } as Record<string, unknown>)
  }

  if (severity === WarningSeverity.None || !WarningIcon) {
    // !WarningIcon for typecheck; should only be null if WarningSeverity == None
    return null
  }

  const checkboxElement = checkboxLabel ? (
    <LabeledCheckbox
      checked={checked ?? checkedFallback}
      gap="$spacing8"
      px="$none"
      size="$icon.16"
      text={
        <Text color="$neutral2" variant="buttonLabel3">
          {checkboxLabel}
        </Text>
      }
      onCheckPressed={onCheckPressed}
    />
  ) : null

  return (
    <InlineCard
      CtaButtonIcon={shouldShowCtaIcon ? InfoCircleFilled : undefined}
      Icon={Icon ?? WarningIcon}
      color={textColor}
      description={
        <Flex gap="$spacing8">
          <Text color="$neutral2" variant="body3" testID={descriptionTestId}>
            {description}
          </Text>
          {checkboxElement}
        </Flex>
      }
      heading={
        heading && (
          <Text color={textColor} variant="body3" testID={headingTestId}>
            {heading}
          </Text>
        )
      }
      iconBackgroundColor={heroIcon ? backgroundColor : undefined}
      iconColor={color}
      onPressCtaButton={onPressCtaButton}
    />
  )
}
