import { Flex, GeneratedIcon, IconProps, Text, ViewProps } from 'ui/src'

type HeaderActionDisplayType = 'text' | 'button'

export type IntroCardProps = {
  Icon: GeneratedIcon
  iconProps?: IconProps
  iconContainerProps?: ViewProps
  title: string
  description: string
  headerActionString?: string
  headerActionType?: HeaderActionDisplayType

  onPress?: () => void
}

export function IntroCard({
  Icon,
  iconProps,
  iconContainerProps,
  title,
  description,
  headerActionString,
  headerActionType = 'text',
  onPress,
}: IntroCardProps): JSX.Element {
  return (
    <Flex
      grow
      row
      alignItems="flex-start"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth={1}
      gap="$spacing12"
      px="$spacing12"
      py="$spacing16"
      shadowColor="$surface3"
      shadowRadius={9.316}
      onPress={onPress}
    >
      <Flex backgroundColor="$surface2" borderRadius="$roundedFull" p="$spacing8" {...iconContainerProps}>
        <Icon color="$neutral1" size="$icon.20" {...iconProps} />
      </Flex>

      <Flex fill gap="$spacing4">
        <Flex row gap="$spacing12" justifyContent="space-between">
          <Text color="$neutral1" variant="subheading2">
            {title}
          </Text>
          {headerActionString && (
            <>
              {headerActionType === 'text' && (
                <Text color="$neutral3" variant="body4">
                  {headerActionString}
                </Text>
              )}
              {headerActionType === 'button' && (
                <Flex backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing6">
                  <Text color="$accent1" variant="buttonLabel4">
                    {headerActionString}
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Flex>
        <Text color="$neutral2" variant="body2">
          {description}
        </Text>
      </Flex>
    </Flex>
  )
}
