import { useState } from 'react'
import { ColorTokens, Flex, GeneratedIcon, InlineCard, LabeledCheckbox, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { OctagonExclamation } from 'ui/src/components/icons/OctagonExclamation'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningColor, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

type InlineWarningCardProps = {
  severity: WarningSeverity
  heading: string
  description: string
  heroIcon?: boolean
  checkboxLabel?: string
}

function getWarningIcon(severity: WarningSeverity): GeneratedIcon {
  switch (severity) {
    case WarningSeverity.High:
      return OctagonExclamation
    case WarningSeverity.Medium:
      return AlertTriangleFilled
    case WarningSeverity.Blocked:
      return Blocked
    default:
      return InfoCircleFilled
  }
}

function getWarningColor(severity: WarningSeverity): WarningColor & { iconColor: ColorTokens } {
  const alertColors = getAlertColor(severity)
  const isInfoTheme =
    severity === WarningSeverity.Low || severity === WarningSeverity.None || severity === WarningSeverity.Blocked
  const iconColor = isInfoTheme ? '$neutral2' : alertColors.text
  const background = isInfoTheme ? '$surface3' : alertColors.background
  const text = isInfoTheme ? '$neutral1' : alertColors.text
  return {
    ...alertColors,
    text,
    iconColor,
    background,
  }
}

export function InlineWarningCard({
  severity,
  heading,
  description,
  checkboxLabel,
  heroIcon,
}: InlineWarningCardProps): JSX.Element {
  const [checked, setChecked] = useState(false)
  const { iconColor, text: textColor, background: backgroundColor } = getWarningColor(severity)
  const WarningIcon = getWarningIcon(severity)

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
      iconColor={iconColor}
    />
  )
}
