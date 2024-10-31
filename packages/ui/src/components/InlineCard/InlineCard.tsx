import { ColorTokens } from 'tamagui'
import { GeneratedIcon, IconProps } from 'ui/src/components/factories/createIcon'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { TouchableArea } from 'ui/src/components/touchable/TouchableArea'

type InlineCardProps = {
  Icon: GeneratedIcon | ((props: IconProps) => JSX.Element)
  iconColor?: ColorTokens
  color: ColorTokens
  description: string | JSX.Element
  iconBackgroundColor?: ColorTokens
  heading?: string
  CtaButtonIcon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  onPressCtaButton?: () => void
}

export function InlineCard({
  Icon,
  iconColor,
  color,
  iconBackgroundColor,
  heading,
  description,
  CtaButtonIcon,
  onPressCtaButton,
}: InlineCardProps): JSX.Element {
  const icon = <Icon color={iconColor ?? color} size="$icon.20" />
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

  const headingElement = heading ? (
    <Text color={color} variant="body3">
      {heading}
    </Text>
  ) : null

  return (
    <Flex row backgroundColor="$surface3" borderRadius="$rounded16" gap="$spacing12" p="$spacing12">
      <Flex>{iconElement}</Flex>
      <Flex fill grow row gap="$spacing4" justifyContent="space-between">
        <Flex fill grow gap="$spacing2">
          {headingElement}
          {descriptionElement}
        </Flex>
        {CtaButtonIcon && (
          <TouchableArea onPress={onPressCtaButton}>
            <CtaButtonIcon color="$neutral3" size="$icon.20" />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
