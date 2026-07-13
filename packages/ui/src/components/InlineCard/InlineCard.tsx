import { ColorTokens } from 'tamagui'
import { GeneratedIcon, IconProps } from 'ui/src/components/factories/createIcon'
import { Flex, FlexProps } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { TouchableArea } from 'ui/src/components/touchable/TouchableArea/TouchableArea'

type InlineCardProps = {
  Icon: GeneratedIcon | ((props: IconProps) => JSX.Element)
  iconColor?: ColorTokens
  iconProps?: FlexProps
  iconSize?: IconProps['size']
  color: ColorTokens
  backgroundColor?: ColorTokens
  padding?: FlexProps['p']
  description: string | JSX.Element
  iconBackgroundColor?: ColorTokens
  heading?: string | JSX.Element
  CtaButtonIcon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  CtaButtonIconColor?: ColorTokens
  onPressCtaButton?: () => void
}

export function InlineCard({
  Icon,
  iconColor,
  iconProps,
  iconSize = '$icon.20',
  color,
  backgroundColor = '$surface2',
  iconBackgroundColor,
  padding = '$spacing12',
  heading,
  description,
  CtaButtonIcon,
  CtaButtonIconColor = '$neutral3',
  onPressCtaButton,
}: InlineCardProps): JSX.Element {
  const icon = <Icon color={iconColor ?? color} size={iconSize} />
  const iconElement = iconBackgroundColor ? (
    <Flex backgroundColor={iconBackgroundColor} borderRadius="$rounded12" p="$spacing8">
      {icon}
    </Flex>
  ) : (
    icon
  )

  const descriptionElement =
    typeof description === 'string' ? (
      <Text color="$neutral2" variant="body3">
        {description}
      </Text>
    ) : (
      description
    )

  const headingElement =
    typeof heading === 'string' ? (
      <Text color={color} variant="body3">
        {heading}
      </Text>
    ) : (
      heading
    )

  return (
    <Flex row backgroundColor={backgroundColor} borderRadius="$rounded16" gap="$spacing12" p={padding}>
      <Flex {...iconProps}>{iconElement}</Flex>
      <Flex fill grow row gap="$spacing4" justifyContent="space-between">
        <Flex fill grow gap="$spacing2">
          {headingElement}
          {descriptionElement}
        </Flex>
        {CtaButtonIcon && (
          <TouchableArea onPress={onPressCtaButton}>
            <CtaButtonIcon color={CtaButtonIconColor} size={iconSize} />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
