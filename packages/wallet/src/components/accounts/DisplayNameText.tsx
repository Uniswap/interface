import { Flex, FlexProps, Text, TextProps } from 'ui/src'
import Unitag from 'ui/src/assets/graphics/unitag.svg'
import { iconSizes, IconSizeTokens } from 'ui/src/theme'
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
    <Flex centered row gap="$spacing4" {...rest}>
      <Text
        {...textProps}
        color={isUnitag ? '$accent1' : textProps?.color ?? '$neutral1'}
        flexShrink={1}
        numberOfLines={1}>
        {displayName?.name}
      </Text>
      {isUnitag ? (
        <Flex mt={-4}>
          <Unitag height={unitagIconSize} width={unitagIconSize} />
        </Flex>
      ) : null}
    </Flex>
  )
}
