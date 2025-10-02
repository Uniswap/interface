import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ClickableWithinGesture,
  ElementAfterText,
  Flex,
  FlexProps,
  GeneratedIcon,
  IconProps,
  Text,
  useIsDarkMode,
  useShadowPropsShort,
  View,
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
}

type IconGraphic = {
  type: IntroCardGraphicType.Icon
  Icon: GeneratedIcon
  iconProps?: IconProps
  iconContainerProps?: FlexProps
}

export type ImageGraphic = {
  type: IntroCardGraphicType.Image
  // biome-ignore lint/suspicious/noExplicitAny: Image type varies by platform
  image: any
}

type IntroCardGraphic = IconGraphic | ImageGraphic

function isIconGraphic(graphic: IntroCardGraphic): graphic is IconGraphic {
  return graphic.type === IntroCardGraphicType.Icon
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
    if (isIcon) {
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
  }, [graphic, isIcon, iconColor])

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

  return (
    <ClickableWithinGesture onPress={pressHandler}>
      <View
        {...shadowProps}
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        flex={1}
        {...containerProps}
      >
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
              variant={isExtensionApp ? 'body4' : description.length > DESCRIPTION_LENGTH_THRESHOLD ? 'body3' : 'body2'}
            >
              {description}
            </Text>
          </Flex>
        </Flex>
      </View>
    </ClickableWithinGesture>
  )
}
