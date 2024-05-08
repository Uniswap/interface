import { Flex, FlexProps, Icons, Text, TextProps } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'

type DisplayNameProps = {
  displayName?: DisplayName
  unitagIconSize?: IconSizeTokens | number
  textProps?: TextProps
  includeUnitagSuffix?: boolean
} & FlexProps

export function DisplayNameText({
  displayName,
  unitagIconSize = '$icon.24',
  textProps,
  includeUnitagSuffix,
  ...rest
}: DisplayNameProps): JSX.Element {
  const isUnitag = displayName?.type === DisplayNameType.Unitag
  const name = isUnitag ? displayName?.name.replaceAll(UNITAG_SUFFIX, '') : displayName?.name

  return (
    <Flex centered row {...rest}>
      <Text {...textProps} color={textProps?.color ?? '$neutral1'} flexShrink={1} numberOfLines={1}>
        {name}
        {isUnitag && includeUnitagSuffix && (
          <Text {...textProps} color="$neutral3" flexShrink={1} numberOfLines={1}>
            {UNITAG_SUFFIX}
          </Text>
        )}
      </Text>
      {isUnitag ? (
        <Flex>
          <Icons.Unitag size={unitagIconSize} />
        </Flex>
      ) : null}
    </Flex>
  )
}
