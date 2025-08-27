import { Flex, FlexProps, Text, TextProps } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { IconSizeTokens } from 'ui/src/theme'
import { DisplayName, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { isAndroid } from 'utilities/src/platform'

type DisplayNameProps = {
  displayName?: DisplayName
  unitagIconSize?: IconSizeTokens | number
  textProps?: TextProps
  includeUnitagSuffix?: boolean
  forcedWidth?: number
  disableForcedWidth?: boolean
} & FlexProps

const platformAdjustedUnitagYPosition = isAndroid ? 3 : 1

export function DisplayNameText({
  displayName,
  unitagIconSize = '$icon.24',
  textProps,
  includeUnitagSuffix,
  forcedWidth,
  disableForcedWidth,
  ...rest
}: DisplayNameProps): JSX.Element {
  const isUnitag = displayName?.type === DisplayNameType.Unitag
  const name = isUnitag ? displayName.name.replaceAll(UNITAG_SUFFIX, '') : displayName?.name

  return (
    <Flex row alignItems="center" {...rest} width={disableForcedWidth ? undefined : forcedWidth}>
      <Text
        {...textProps}
        color={textProps?.color ?? '$neutral1'}
        flexShrink={1}
        numberOfLines={1}
        whiteSpace="initial"
      >
        {name}
        {isUnitag && includeUnitagSuffix && (
          <Text {...textProps} color="$neutral2" flexShrink={1} numberOfLines={1}>
            {UNITAG_SUFFIX}
          </Text>
        )}
      </Text>
      {isUnitag ? (
        <Flex display="inline" y={platformAdjustedUnitagYPosition}>
          <Unitag size={unitagIconSize} />
        </Flex>
      ) : null}
    </Flex>
  )
}
