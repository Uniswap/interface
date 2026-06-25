import { Flex, Input, Text } from 'ui/src'
import {
  GasFieldTooltip,
  type GasTooltipKey,
} from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTooltip'
import { useEvent } from 'utilities/src/react/hooks'

const DISALLOWED_CHARS = /[^0-9.,]/g

export interface GasFieldInputProps {
  label: string
  value: string
  hint?: string
  unit?: string
  onChangeValue: (next: string) => void
  tooltipKey: GasTooltipKey
  error?: string
  warning?: string
  autoFocus?: boolean
}

export function GasFieldInput({
  label,
  value,
  hint,
  unit,
  onChangeValue,
  tooltipKey,
  error,
  warning,
  autoFocus,
}: GasFieldInputProps): JSX.Element {
  const handleChangeText = useEvent((next: string) => {
    onChangeValue(next.replace(DISALLOWED_CHARS, ''))
  })

  return (
    <Flex gap="$spacing8">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body3" color="$neutral1">
            {label}
          </Text>
          <GasFieldTooltip tooltipKey={tooltipKey} />
        </Flex>
        {hint && (
          <Text variant="body3" color="$neutral3">
            {hint}
          </Text>
        )}
      </Flex>
      <Flex
        row
        alignItems="center"
        backgroundColor={error ? '$statusCritical2' : '$transparent'}
        borderColor={error ? '$statusCritical' : '$surface3'}
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        px="$spacing12"
        py="$spacing8"
      >
        <Input
          flex={1}
          accessibilityLabel={label}
          aria-label={label}
          autoFocus={autoFocus}
          backgroundColor="$transparent"
          borderWidth={0}
          color="$neutral1"
          fontFamily="$body"
          fontSize="$medium"
          height="auto"
          keyboardType="decimal-pad"
          outlineColor="$transparent"
          p="$none"
          placeholderTextColor="$neutral3"
          value={value}
          onChangeText={handleChangeText}
        />
        {unit ? (
          <Text variant="body3" color="$neutral2" pl="$spacing8">
            {unit}
          </Text>
        ) : null}
      </Flex>
      {error && (
        <Text variant="body4" color="$statusCritical">
          {error}
        </Text>
      )}
      {!error && warning && (
        <Text variant="body4" color="$statusWarning">
          {warning}
        </Text>
      )}
    </Flex>
  )
}
