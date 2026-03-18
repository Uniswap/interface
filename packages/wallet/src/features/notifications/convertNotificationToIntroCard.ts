import { BackgroundType, ContentStyle, type InAppNotification } from '@universe/api'
import { ImageSourcePropType } from 'react-native'
import { GeneratedIcon } from 'ui/src'
import { Bell, Coin, Person, ShieldCheck } from 'ui/src/components/icons'
import { parseCustomIconLink } from 'uniswap/src/components/notifications/iconUtils'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { getLogger } from 'utilities/src/logger/logger'
import { CardType, IntroCardGraphicType, type IntroCardProps } from 'wallet/src/components/introCards/IntroCard'

interface NotificationExtra {
  cardType?: 'required' | 'dismissible'
  graphicType?: 'icon' | 'gradient'
}

/**
 * Converts an InAppNotification to IntroCardProps for rendering with IntroCard component.
 *
 * Maps notification API fields to IntroCard props:
 * - content.title → title
 * - content.subtitle → description
 * - content.background.link → gradientImage (for gradient type)
 * - content.iconLink → icon image (for gradient type)
 * - content.extra → cardType and graphicType metadata
 *
 * For icon mapping, we hardcode based on notification ID (like web does for now).
 */
export function convertNotificationToIntroCard(
  notification: InAppNotification,
  callbacks: {
    onPress?: () => void
    onClose?: () => void
  },
): IntroCardProps | null {
  const { id, content } = notification

  // Only convert LOWER_LEFT_BANNER style notifications
  if (content?.style !== ContentStyle.LOWER_LEFT_BANNER) {
    return null
  }

  // Parse extra metadata
  let extra: NotificationExtra = {}
  try {
    if (content.extra) {
      extra = JSON.parse(content.extra)
    }
  } catch (error) {
    getLogger().warn('convertNotificationToIntroCard', 'parseExtra', 'Failed to parse extra field', {
      notificationId: id,
      error,
    })
  }

  const title = content.title
  const description = content.subtitle
  const cardType = extra.cardType === 'required' ? CardType.Required : CardType.Dismissible

  let Icon: GeneratedIcon = Bell
  let loggingName: OnboardingCardLoggingName = OnboardingCardLoggingName.Unknown
  let localGradientIcon: ImageSourcePropType | undefined
  let localGradientImage: ImageSourcePropType | undefined

  if (id === 'local:recovery_backup_banner') {
    Icon = ShieldCheck
    loggingName = OnboardingCardLoggingName.RecoveryBackup
  } else if (id === 'local:fund_wallet_banner') {
    Icon = Coin
    loggingName = OnboardingCardLoggingName.FundWallet
  } else if (id === 'local:unitag_claim_banner') {
    Icon = Person
    loggingName = OnboardingCardLoggingName.ClaimUnitag
  }

  // Parse custom icon format (e.g. "custom:lightning-$accent1")
  const parsedCustomIcon = parseCustomIconLink(content.iconLink)
  const customIconComponent = parsedCustomIcon.IconComponent
  const customIconColor = parsedCustomIcon.colorToken

  // Determine graphic type based on available data
  // Validate link is non-empty to avoid React Native Image failing with empty URIs
  const backgroundLink =
    content.background?.backgroundType === BackgroundType.IMAGE ? content.background.link : undefined

  // Determine the gradient image source - must be valid for gradient type
  const gradientImageSource: ImageSourcePropType | undefined =
    localGradientImage ?? (backgroundLink ? { uri: backgroundLink } : undefined)

  // For icon overlay: use local asset, or URL-based iconLink (skip custom: format which isn't a valid URI)
  const iconImageSource: ImageSourcePropType | undefined =
    localGradientIcon ?? (content.iconLink && !customIconComponent ? { uri: content.iconLink } : undefined)

  const graphic: IntroCardProps['graphic'] = gradientImageSource
    ? {
        type: IntroCardGraphicType.Gradient,
        icon: iconImageSource,
        FallbackIcon: customIconComponent ?? Bell,
        gradientImage: gradientImageSource,
      }
    : {
        type: IntroCardGraphicType.Icon,
        Icon: customIconComponent ?? Icon,
      }

  return {
    id,
    loggingName,
    graphic,
    title,
    description,
    cardType,
    iconColor: customIconColor,
    onPress: callbacks.onPress,
    onClose: cardType === CardType.Dismissible ? callbacks.onClose : undefined,
  }
}

/**
 * Determines if a notification should be rendered as an IntroCard
 * rather than a standard notification.
 */
export function shouldRenderAsIntroCard(notification: InAppNotification): boolean {
  return notification.content?.style === ContentStyle.LOWER_LEFT_BANNER
}
