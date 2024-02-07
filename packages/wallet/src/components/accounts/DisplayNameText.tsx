import { Flex, FlexProps, Text, TextProps } from 'ui/src'
import Unitag from 'ui/src/assets/graphics/unitag.svg'
import { IconSizeTokens, iconSizes } from 'ui/src/theme'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'

type DisplayNameProps = {
  displayName?: DisplayName
  unitagIconSize?: IconSizeTokens | number
  textProps?: TextProps
} & FlexProps

export function DisplayNameText({
  displayName,
  unitagIconSize = iconSizes.icon24,
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
          <Unitag height={unitagIconSize} width={unitagIconSize} />
        </Flex>
      ) : null}
    </Flex>
  )
}
