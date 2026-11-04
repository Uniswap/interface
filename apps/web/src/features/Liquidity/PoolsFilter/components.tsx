import { Flex, Input, Text, TouchableArea } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { numericInputEnforcer } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'

/** A titled section in the pools filter modal. Titles sit above their content, or inline for toggles/rows. */
export function PoolFilterSection({
  title,
  orientation = 'vertical',
  children,
}: {
  title: string
  orientation?: 'vertical' | 'horizontal'
  children: ReactNode
}): JSX.Element {
  const heading = (
    <Text variant="subheading2" color="$neutral1">
      {title}
    </Text>
  )

  if (orientation === 'horizontal') {
    return (
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12" width="100%">
        {heading}
        {children}
      </Flex>
    )
  }

  return (
    <Flex gap="$spacing12" width="100%">
      {heading}
      {children}
    </Flex>
  )
}

/** Rounded selectable tag used for the Protocol and TVL quick-select rows. */
export function PoolFilterChip({
  selected,
  label,
  onPress,
  testID,
}: {
  selected: boolean
  label: string
  onPress: () => void
  testID?: string
}): JSX.Element {
  return (
    <TouchableArea
      row
      alignItems="center"
      justifyContent="center"
      height={32}
      borderRadius="$rounded12"
      // Transparent 1px border when unselected keeps the box the same size, so selecting doesn't shift layout.
      borderWidth={1}
      borderColor={selected ? '$accent1' : '$transparent'}
      backgroundColor={selected ? '$accent2' : '$surface2'}
      hoverStyle={{ backgroundColor: selected ? '$accent2' : '$surface2Hovered' }}
      px="$spacing12"
      testID={testID}
      onPress={onPress}
    >
      <Text variant="buttonLabel3" color={selected ? '$accent1' : '$neutral2'} $platform-web={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </TouchableArea>
  )
}

/**
 * A bordered number field with an optional percent suffix, matching the Figma inputs. Accepts only a
 * non-negative decimal: edits that would leave a non-numeric value are dropped, and `,` is read as `.`.
 */
export function PoolFilterRangeInput({
  value,
  onChangeText,
  placeholder,
  suffix,
  testID,
}: {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  suffix?: string
  testID?: string
}): JSX.Element {
  const handleChangeText = (text: string): void => {
    const normalized = text.replace(/,/g, '.')
    if (numericInputEnforcer(normalized)) {
      onChangeText(normalized)
    }
  }

  return (
    <Flex
      row
      flex={1}
      alignItems="center"
      gap="$spacing6"
      height={36}
      px="$spacing12"
      backgroundColor="$surface1"
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded16"
    >
      <Input
        flex={1}
        width="100%"
        height="100%"
        px={0}
        py={0}
        borderWidth={0}
        fontSize={14}
        backgroundColor="$transparent"
        color="$neutral1"
        placeholder={placeholder}
        placeholderTextColor="$neutral3"
        value={value}
        keyboardType="decimal-pad"
        onChangeText={handleChangeText}
        testID={testID}
      />
      {suffix ? (
        <Text variant="body3" color="$neutral2">
          {suffix}
        </Text>
      ) : null}
    </Flex>
  )
}

/** Two range inputs separated by an em dash (min — max). */
export function PoolFilterRangeRow({ min, max }: { min: JSX.Element; max: JSX.Element }): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing12" width="100%">
      {min}
      <Text variant="body3" color="$neutral2">
        —
      </Text>
      {max}
    </Flex>
  )
}
