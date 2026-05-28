import { type ReactNode } from 'react'
import { Flex, type FlexProps, HeightAnimator, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'

export interface InlineExpandoRowProps {
  isExpanded: boolean
  label: string
  onPress: () => void
  testID?: string
  body?: ReactNode
  px?: FlexProps['px']
  py?: FlexProps['py']
}

export function InlineExpandoRow({
  isExpanded,
  label,
  onPress,
  testID,
  body,
  px,
  py,
}: InlineExpandoRowProps): JSX.Element {
  return (
    <>
      <TouchableArea
        row
        gap="$gap8"
        alignItems="center"
        p="$spacing16"
        px={px}
        py={py}
        testID={testID}
        onPress={onPress}
      >
        <Text variant="body2" color="$neutral2">
          {label}
        </Text>
        <Flex justifyContent="center" testID="expando-row-icon">
          {isExpanded ? (
            <ChevronsIn color="$neutral2" size="$icon.20" />
          ) : (
            <ChevronsOut color="$neutral2" size="$icon.20" />
          )}
        </Flex>
      </TouchableArea>
      {body !== undefined && (
        <HeightAnimator useInitialHeight unmountChildrenWhenCollapsed open={isExpanded}>
          {body}
        </HeightAnimator>
      )}
    </>
  )
}
