import { ReactNode } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

export function SettingsButton({
  title,
  currentState,
  onClick,
  testId,
  showArrow = true,
  icon,
}: {
  title: ReactNode
  currentState?: ReactNode
  onClick: () => void
  testId?: string
  showArrow?: boolean
  icon?: ReactNode
}): JSX.Element {
  return (
    <TouchableArea
      row
      alignItems="center"
      justifyContent="space-between"
      // Negative horizontal margin pulls the row's box out past the parent
      // SettingsMenu's `px="$padding12"`, then matching inner padding pushes
      // content back to the original x. Net: content stays put, hover bg
      // reaches the SlideOutMenu edges. `mx` stays numeric because Tamagui's
      // negative-token syntax isn't wired up in this codebase (the convention
      // is raw numbers for negatives, cf. AuthenticatedHeader.tsx); `px`
      // tracks $padding12 so the two halves can't drift independently.
      mx={-12}
      px="$padding12"
      py="$padding12"
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={onClick}
      testID={testId}
    >
      <Flex row gap="$gap12" alignItems="center">
        {icon}
        <Text variant="subheading2" color="$neutral1">
          {title}
        </Text>
      </Flex>
      <Flex row gap="$spacing4" alignItems="center" width="min-content">
        {currentState && (
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            {currentState}
          </Text>
        )}
        {showArrow && <RotatableChevron color="$neutral3" direction="right" size="$icon.20" />}
      </Flex>
    </TouchableArea>
  )
}
