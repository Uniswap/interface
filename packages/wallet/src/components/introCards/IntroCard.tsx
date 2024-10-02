import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Flex, GeneratedIcon, IconProps, Text, ViewProps, useIsDarkMode, useShadowPropsShort } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { useTranslation } from 'uniswap/src/i18n'
import { isExtension } from 'utilities/src/platform'

export enum CardType {
  Required,
  Dismissible,
  Swipe,
}

export type IntroCardProps = {
  Icon: GeneratedIcon
  iconProps?: IconProps
  iconContainerProps?: ViewProps
  title: string
  description: string
  cardType: CardType

  onClose?: () => void
}

export function IntroCard({
  Icon,
  iconProps,
  iconContainerProps,
  title,
  description,
  cardType,
  onClose,
}: IntroCardProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const shadowProps = useShadowPropsShort()
  const { t } = useTranslation()

  const tap = Gesture.Tap()
    .enabled(!!onClose)
    .runOnJS(true)
    .onEnd(() => {
      onClose?.()
    })

  return (
    <Flex
      {...shadowProps}
      grow
      row
      alignItems="flex-start"
      backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth={1}
      gap="$spacing12"
      p={isExtension ? '$spacing12' : '$spacing16'}
      paddingStart="$spacing12"
    >
      <Flex
        backgroundColor={isDarkMode ? '$surface3' : '$surface2'}
        borderRadius="$roundedFull"
        p="$spacing8"
        {...iconContainerProps}
      >
        <Icon color="$neutral1" size={isExtension ? '$icon.16' : '$icon.20'} {...iconProps} />
      </Flex>

      <Flex fill gap="$spacing4">
        <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
          <Text color="$neutral1" variant={isExtension ? 'body3' : 'subheading2'}>
            {title}
          </Text>
          {cardType === CardType.Required ? (
            <Flex
              backgroundColor={isDarkMode ? '$surface3' : '$surface2'}
              borderRadius="$rounded8"
              px="$spacing8"
              py="$spacing4"
            >
              <Text color="$neutral2" variant="buttonLabel3">
                {t('onboarding.home.intro.label.required')}
              </Text>
            </Flex>
          ) : cardType === CardType.Dismissible ? (
            <GestureDetector gesture={tap}>
              <Flex p="$spacing4">
                <X color="$neutral3" size="$icon.16" />
              </Flex>
            </GestureDetector>
          ) : cardType === CardType.Swipe ? (
            <Text color="$neutral3" variant="body4">
              {t('onboarding.home.intro.label.swipe')}
            </Text>
          ) : null}
        </Flex>
        <Text color="$neutral2" variant={isExtension ? 'body4' : 'body2'}>
          {description}
        </Text>
      </Flex>
    </Flex>
  )
}
