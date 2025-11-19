import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageSourcePropType } from 'react-native'
import {
  ClickableWithinGesture,
  ElementAfterText,
  Flex,
  FlexProps,
  GeneratedIcon,
  IconProps,
  LinearGradient,
  Image as TamaguiImage,
  Text,
  useIsDarkMode,
  useShadowPropsShort,
} from 'ui/src'
import { X } from 'ui/src/components/icons'
import { CardImage, CardImageGraphicSizeInfo } from 'uniswap/src/components/cards/image'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  CardLoggingName,
  ConnectionCardLoggingName,
  DappRequestCardLoggingName,
  OnboardingCardLoggingName,
} from 'uniswap/src/features/telemetry/types'
import { isExtensionApp } from 'utilities/src/platform'

const DESCRIPTION_LENGTH_THRESHOLD = 66

export enum CardType {
  Default = 0,
  Required = 1,
  Dismissible = 2,
  Swipe = 3,
}

export enum IntroCardGraphicType {
  Icon = 0,
  Image = 1,
  Gradient = 2,
}

type IconGraphic = {
  type: IntroCardGraphicType.Icon
  Icon: GeneratedIcon
  iconProps?: IconProps
  iconContainerProps?: FlexProps
}

export type ImageGraphic = {
  type: IntroCardGraphicType.Image
  image: ImageSourcePropType
}

type GradientGraphic = {
  type: IntroCardGraphicType.Gradient
  icon: ImageSourcePropType
  gradientImage: ImageSourcePropType
}

type IntroCardGraphic = IconGraphic | ImageGraphic | GradientGraphic

function isIconGraphic(graphic: IntroCardGraphic): graphic is IconGraphic {
  return graphic.type === IntroCardGraphicType.Icon
}

function isGradientGraphic(graphic: IntroCardGraphic): graphic is GradientGraphic {
  return graphic.type === IntroCardGraphicType.Gradient
}

export type IntroCardProps = {
  graphic: IntroCardGraphic
  title: string
  description: string
  cardType: CardType
  isNew?: boolean
  loggingName: CardLoggingName
  containerProps?: FlexProps
  iconColor?: string
  onPress?: () => void
  onClose?: () => void
}

export function isOnboardingCardLoggingName(
  name: OnboardingCardLoggingName | DappRequestCardLoggingName | ConnectionCardLoggingName,
): name is OnboardingCardLoggingName {
  return Object.values(OnboardingCardLoggingName).includes(name as OnboardingCardLoggingName)
}

export function isDappRequestCardLoggingName(
  name: OnboardingCardLoggingName | DappRequestCardLoggingName | ConnectionCardLoggingName,
): name is DappRequestCardLoggingName {
  return Object.values(DappRequestCardLoggingName).includes(name as DappRequestCardLoggingName)
}

export function IntroCard({
  graphic,
  title,
  description,
  cardType,
  isNew = false,
  containerProps,
  loggingName,
  iconColor = '$neutral1',
  onPress,
  onClose,
}: IntroCardProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const shadowProps = useShadowPropsShort()
  const { t } = useTranslation()

  const isIcon = isIconGraphic(graphic)
  const isGradient = isGradientGraphic(graphic)
  const [isHovered, setIsHovered] = useState(false)

  const closeHandler = useCallback(() => {
    if (onClose) {
      onClose()
      if (isOnboardingCardLoggingName(loggingName)) {
        sendAnalyticsEvent(WalletEventName.OnboardingIntroCardClosed, {
          card_name: loggingName,
        })
      } else if (isDappRequestCardLoggingName(loggingName)) {
        sendAnalyticsEvent(WalletEventName.DappRequestCardClosed, {
          card_name: loggingName,
        })
      }
    }
  }, [loggingName, onClose])

  const pressHandler = useCallback(() => {
    onPress?.()
    if (isOnboardingCardLoggingName(loggingName)) {
      sendAnalyticsEvent(WalletEventName.OnboardingIntroCardPressed, {
        card_name: loggingName,
      })
    } else if (isDappRequestCardLoggingName(loggingName)) {
      sendAnalyticsEvent(WalletEventName.DappRequestCardPressed, {
        card_name: loggingName,
      })
    }
  }, [loggingName, onPress])

  const GraphicElement = useMemo(() => {
    if (isGradient) {
      return (
        <Flex
          backgroundColor="$surface1"
          borderRadius="$rounded12"
          height={32}
          width={32}
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          flexShrink={0}
        >
          <TamaguiImage source={graphic.icon} style={{ width: 32, height: 32 }} resizeMode="contain" />
        </Flex>
      )
    } else if (isIcon) {
      return (
        <Flex p="$spacing2" {...graphic.iconContainerProps}>
          <graphic.Icon color={iconColor} size="$icon.20" {...graphic.iconProps} />
        </Flex>
      )
    } else {
      return (
        <Flex width={CardImageGraphicSizeInfo.containerWidth}>
          <CardImage uri={graphic.image} />
        </Flex>
      )
    }
  }, [graphic, isIcon, isGradient, iconColor])

  const topRightElement = useMemo(() => {
    switch (cardType) {
      case CardType.Required:
        return (
          <Flex
            backgroundColor={isDarkMode ? '$surface3' : '$surface2'}
            borderRadius="$rounded8"
            px="$spacing8"
            py="$spacing4"
          >
            <Text color="$neutral2" variant="buttonLabel4">
              {t('onboarding.home.intro.label.required')}
            </Text>
          </Flex>
        )
      case CardType.Dismissible:
        return (
          <ClickableWithinGesture onPress={closeHandler}>
            <Flex p="$spacing4">
              <X color="$neutral3" size="$icon.16" />
            </Flex>
          </ClickableWithinGesture>
        )
      case CardType.Swipe:
        return (
          <Text color="$neutral3" variant="body4">
            {t('onboarding.home.intro.label.swipe')}
          </Text>
        )
      default:
        return null
    }
  }, [cardType, isDarkMode, closeHandler, t])

  const cardPadding = isExtensionApp ? '$spacing12' : '$spacing16'

  const containerBaseProps = useMemo(
    () => ({
      ...shadowProps,
      borderColor: '$surface3' as const,
      borderWidth: '$spacing1' as const,
      ...containerProps,
    }),
    [shadowProps, containerProps],
  )

  const backgroundColor = isDarkMode ? '$surface2' : '$surface1'
  const backgroundColorHovered = isDarkMode ? '$surface2Hovered' : '$surface1Hovered'
  const gradientStartColor = isDarkMode ? 'transparent' : 'rgba(255, 255, 255,0)'

  const gradientBackground = useMemo(() => {
    if (!isGradient) {
      return null
    }
    return (
      <Flex position="absolute" left={0} top={0} bottom={0} width={120}>
        <TamaguiImage
          source={graphic.gradientImage}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 120,
            height: '100%',
            opacity: 0.52,
          }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[gradientStartColor, isHovered ? backgroundColorHovered : backgroundColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.775]}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 120,
          }}
        />
      </Flex>
    )
  }, [isGradient, graphic, backgroundColor, backgroundColorHovered, gradientStartColor, isHovered])

  const gradientCloseButton = useMemo(
    () => (
      <Flex position="absolute" right={10} top={10}>
        <ClickableWithinGesture onPress={closeHandler}>
          <Flex
            backgroundColor="$surface3"
            borderRadius="$roundedFull"
            height={20}
            width={20}
            alignItems="center"
            justifyContent="center"
            p="$spacing2"
          >
            <X color="$neutral1" size="$icon.12" />
          </Flex>
        </ClickableWithinGesture>
      </Flex>
    ),
    [closeHandler],
  )

  return (
    <ClickableWithinGesture onPress={pressHandler}>
      <Flex
        {...containerBaseProps}
        backgroundColor={backgroundColor}
        borderRadius={isGradient ? '$rounded16' : '$rounded20'}
        overflow={isGradient ? 'hidden' : undefined}
        position={isGradient ? 'relative' : undefined}
        flex={isGradient ? undefined : 1}
        onMouseEnter={isGradient ? (): void => setIsHovered(true) : undefined}
        onMouseLeave={isGradient ? (): void => setIsHovered(false) : undefined}
      >
        {gradientBackground}

        {isGradient ? (
          <Flex gap="$spacing8" px="$spacing12" py="$spacing24" position="relative">
            <Flex row alignItems="center" gap="$spacing12" pr="$spacing24">
              {GraphicElement}
              <Flex fill gap="$spacing4">
                <Text color="$neutral1" variant="body3">
                  {title}
                </Text>
                <Text color="$neutral2" variant="body4">
                  {description}
                </Text>
              </Flex>
            </Flex>
            {gradientCloseButton}
          </Flex>
        ) : (
          <Flex
            grow
            row
            alignItems="flex-start"
            borderRadius="$rounded20"
            gap="$spacing12"
            pl={isIcon ? '$spacing12' : '$none'}
            pr={cardPadding}
            overflow="hidden"
            py={cardPadding}
            flex={1}
          >
            {GraphicElement}
            <Flex fill gap="$spacing4" paddingStart={isIcon ? '$none' : '$spacing12'} py="$spacing2">
              <Flex row justifyContent="space-between">
                <Flex fill>
                  <ElementAfterText
                    text={title}
                    textProps={{ color: '$neutral1', variant: isExtensionApp ? 'body3' : 'subheading2' }}
                    element={isNew ? <NewTag /> : undefined}
                  />
                </Flex>
                <Flex alignContent="flex-end" alignItems="flex-end">
                  {topRightElement}
                </Flex>
              </Flex>
              <Text
                color="$neutral2"
                variant={
                  isExtensionApp ? 'body4' : description.length > DESCRIPTION_LENGTH_THRESHOLD ? 'body3' : 'body2'
                }
              >
                {description}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>
    </ClickableWithinGesture>
  )
}
