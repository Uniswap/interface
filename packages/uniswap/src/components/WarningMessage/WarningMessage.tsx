import { ColorTokens, Flex, Text, Tooltip } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { zIndexes } from 'ui/src/theme'

interface WarningMessageProps {
  warningMessage: string
  color: ColorTokens
  tooltipText?: string
}

export function WarningMessage({ warningMessage, color, tooltipText }: WarningMessageProps): JSX.Element {
  const warningContent = (
    <Flex row alignItems="center" gap="$gap4">
      <AlertTriangleFilled color={color} size="$icon.16" />
      <Text variant="body3" color={color}>
        {warningMessage}
      </Text>
    </Flex>
  )

  if (tooltipText) {
    return (
      <Tooltip>
        <Tooltip.Trigger>{warningContent}</Tooltip.Trigger>
        <Tooltip.Content zIndex={zIndexes.overlay}>
          <Text variant="body4">{tooltipText}</Text>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return warningContent
}
