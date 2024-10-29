import { useState } from 'react'
import { Flex, InlineCard, LabeledCheckbox, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIcon, getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
}: InlineWarningCardProps): JSX.Element | null {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const [checkedFallback, setCheckedFallback] = useState(false)
  const { color, textColor, backgroundColor } = getWarningIconColors(severity)
  const WarningIcon = getWarningIcon(severity, tokenProtectionEnabled)
  const shouldShowCtaIcon = !hideCtaIcon && severity !== WarningSeverity.Low && severity !== WarningSeverity.None

  const onCheckPressed = (isChecked: boolean): void => {
    if (setChecked) {
      setChecked(!isChecked)
    } else {
      setCheckedFallback(!isChecked)
    }
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
      Icon={WarningIcon}
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
