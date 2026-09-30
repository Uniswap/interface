import { Flex, Text, type TextProps, TouchableArea } from '@universe/mycelium'
import type { ColorTokens } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ComponentProps } from 'react'
import type { Animated } from 'react-native'
import { Separator, useLayoutAnimationOnChange } from 'ui/src'
import type { IconProps } from 'ui/src/components/factories/createIcon'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'

/**
 * Legacy `GetThemeValueForKey<'marginHorizontal' | 'paddingVertical'>` retyped as a plain
 * space-token string (both live call sites only ever pass a `$spacing*` token or leave it
 * undefined); `TouchableArea.mx`/`Flex.py` themselves still resolve whatever value flows in.
 * Unlike the closed union it replaces, a typo'd token (e.g. `"$saping8"`) is a silent runtime
 * no-op here, not a compile error.
 */
type LegacySpaceValue = number | Animated.AnimatedNode | `$${string}` | null

export type ExpandoRowProps = {
  isExpanded: boolean
  onPress: () => void
  label: string
  mx?: LegacySpaceValue
  py?: LegacySpaceValue
  color?: ColorTokens
  labelVariant?: TextProps['variant']
  iconSize?: IconProps['size']
}

export function ExpandoRow({
  label,
  isExpanded,
  onPress,
  mx,
  py = '$spacing8',
  color = '$neutral3',
  labelVariant = 'body3',
  iconSize = '$icon.16',
}: ExpandoRowProps): JSX.Element {
  useLayoutAnimationOnChange(isExpanded)

  return (
    // The compat `mx`/`py` types are a closed token union (SpaceValue), narrower than the open
    // `$${string}` template (and `AnimatedNode`) this legacy prop type carries; `LegacySpaceValue`
    // covers every value that ever flows through here, so this boundary cast is safe.
    <TouchableArea
      activeOpacity={1}
      mx={mx as unknown as ComponentProps<typeof TouchableArea>['mx']}
      testID={TestID.ExpandoRow}
      onPress={onPress}
    >
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        py={py as unknown as ComponentProps<typeof Flex>['py']}
      >
        <Flex centered grow row gap="$spacing12">
          <Separator />

          <Flex centered row gap="$gap4">
            <Text color={color} textAlign="center" variant={labelVariant} testID={TestID.ExpandoRowLabel}>
              {label}
            </Text>

            <Flex centered justifyContent="center" testID={TestID.ExpandoRowIcon}>
              {isExpanded ? (
                <ChevronsIn color={color} size={iconSize} />
              ) : (
                <ChevronsOut color={color} size={iconSize} />
              )}
            </Flex>
          </Flex>

          <Separator />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
