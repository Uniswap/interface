import type { Animated } from 'react-native'
import {
  ColorTokens,
  Flex,
  GetThemeValueForKey,
  Separator,
  Text,
  TouchableArea,
  useLayoutAnimationOnChange,
} from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export type ExpandoRowProps = {
  isExpanded: boolean
  onPress: () => void
  label: string
  mx?: number | Animated.AnimatedNode | GetThemeValueForKey<'marginHorizontal'> | null
  py?: number | Animated.AnimatedNode | GetThemeValueForKey<'paddingVertical'> | null
  color?: ColorTokens
}

export function ExpandoRow({
  label,
  isExpanded,
  onPress,
  mx,
  py = '$spacing8',
  color = '$neutral3',
}: ExpandoRowProps): JSX.Element {
  useLayoutAnimationOnChange(isExpanded)

  return (
    <TouchableArea activeOpacity={1} mx={mx} testID={TestID.ExpandoRow} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py={py}>
        <Flex centered grow row gap="$spacing12">
          <Separator />

          <Flex centered row gap="$gap4">
            <Text color={color} textAlign="center" variant="body3" testID={TestID.ExpandoRowLabel}>
              {label}
            </Text>

            <Flex centered justifyContent="center" testID={TestID.ExpandoRowIcon}>
              {isExpanded ? (
                <ChevronsIn color={color} size="$icon.16" />
              ) : (
                <ChevronsOut color={color} size="$icon.16" />
              )}
            </Flex>
          </Flex>

          <Separator />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
