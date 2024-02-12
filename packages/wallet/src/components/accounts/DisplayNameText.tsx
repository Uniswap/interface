import { Flex, FlexProps, Icons, Text, TextProps } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'

type DisplayNameProps = {
  displayName?: DisplayName
  unitagIconSize?: IconSizeTokens | number
  textProps?: TextProps
} & FlexProps

export function DisplayNameText({
  displayName,
  unitagIconSize = '$icon.24',
  textProps,
  ...rest
}: DisplayNameProps): JSX.Element {
  const isUnitag = displayName?.type === DisplayNameType.Unitag

  return (
    <Flex centered row gap="$spacing2" {...rest}>
      <Text {...textProps} color={textProps?.color ?? '$neutral1'} flexShrink={1} numberOfLines={1}>
        {displayName?.name}
      </Text>
      {isUnitag ? (
        <Flex>
          <Icons.Unitag size={unitagIconSize} />
        </Flex>
      ) : null}
    </Flex>
  )
}
