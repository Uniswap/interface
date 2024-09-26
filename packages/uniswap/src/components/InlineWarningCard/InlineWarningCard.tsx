import { useState } from 'react'
import { Flex, InlineCard, LabeledCheckbox, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIcon, getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

type InlineWarningCardProps = {
  severity: WarningSeverity
  heading: string
  description: string
  heroIcon?: boolean
  checkboxLabel?: string
}

export function InlineWarningCard({
  severity,
  heading,
  description,
  checkboxLabel,
  heroIcon,
}: InlineWarningCardProps): JSX.Element {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const [checked, setChecked] = useState(false)
  const { color, textColor, backgroundColor } = getWarningIconColors(severity)
  const WarningIcon = getWarningIcon(severity, tokenProtectionEnabled)

  const onCheckPressed = (isChecked: boolean): void => {
    setChecked(!isChecked)
  }

  const checkboxElement = checkboxLabel ? (
    <LabeledCheckbox
      checked={checked}
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
      CtaButtonIcon={InfoCircleFilled}
      Icon={WarningIcon}
      color={textColor}
      description={
        <Flex gap="$spacing8">
          <Text color="$neutral2" variant="body3">
            {description}
          </Text>
          {checkboxElement}
        </Flex>
      }
      heading={heading}
      iconBackgroundColor={heroIcon ? backgroundColor : undefined}
      iconColor={color}
    />
  )
}
