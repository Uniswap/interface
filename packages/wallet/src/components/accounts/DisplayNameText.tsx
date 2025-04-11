import { Flex, FlexProps, Text, TextProps } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { IconSizeTokens } from 'ui/src/theme'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { isAndroid } from 'utilities/src/platform'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'

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
  const name = isUnitag ? displayName?.name.replaceAll(UNITAG_SUFFIX, '') : displayName?.name

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
        {isUnitag ? (
          <Flex display="inline" pl="$spacing4" bottom="$spacing2" y={platformAdjustedUnitagYPosition}>
            <Unitag size={unitagIconSize} />
          </Flex>
        ) : null}
      </Text>
    </Flex>
  )
}
