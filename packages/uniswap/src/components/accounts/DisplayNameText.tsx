import { isAndroid } from '@universe/environment'
import { Flex, FlexProps, Text, TextProps } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { IconSizeTokens } from 'ui/src/theme'
import { DisplayName, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

type DisplayNameProps = {
  displayName?: DisplayName
  unitagIconSize?: IconSizeTokens | number
  textProps?: TextProps
  includeUnitagSuffix?: boolean
} & FlexProps

const INLINE_UNITAG_Y_OFFSET = 2

export function DisplayNameText({
  displayName,
  unitagIconSize = '$icon.24',
  textProps,
  includeUnitagSuffix,
  ...rest
}: DisplayNameProps): JSX.Element {
  const isUnitag = displayName?.type === DisplayNameType.Unitag
  const name = isUnitag ? displayName.name.replaceAll(UNITAG_SUFFIX, '') : displayName?.name

  const suffix = isUnitag && includeUnitagSuffix && (
    <Text {...textProps} color="$neutral2" flexShrink={1}>
      {UNITAG_SUFFIX}
    </Text>
  )

  // Android: render the unitag icon as a row sibling. The inline View-in-Text path below relies on
  // a y-offset that Fabric no longer honors, collapsing the icon to origin and overlapping siblings.
  if (isAndroid) {
    return (
      <Flex row grow alignItems="center" {...rest}>
        <Text {...textProps} color={textProps?.color ?? '$neutral1'} flexShrink={1} whiteSpace="initial">
          {name}
          {suffix}
        </Text>
        {isUnitag ? (
          <Flex pl="$spacing2">
            <Unitag size={unitagIconSize} />
          </Flex>
        ) : null}
      </Flex>
    )
  }

  return (
    <Flex row grow {...rest}>
      <Text {...textProps} color={textProps?.color ?? '$neutral1'} flexShrink={1} whiteSpace="initial">
        {name}
        {suffix}
        {isUnitag ? (
          <Flex display="inline" y={INLINE_UNITAG_Y_OFFSET} pl="$spacing2">
            <Unitag size={unitagIconSize} />
          </Flex>
        ) : null}
      </Text>
    </Flex>
  )
}
