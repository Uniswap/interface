import { ReactNode } from 'react'
import {
  Button,
  Flex,
  FlexProps,
  IconButton,
  Image,
  LinearGradient,
  styled,
  Text,
  useIsDarkMode,
  useMedia,
} from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { parseCustomIconLink } from 'uniswap/src/components/notifications/iconUtils'
import { ElementName, type ModalNameType } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isMobileApp, isWebApp } from 'utilities/src/platform'

const MODAL_MAX_WIDTH = 440

const GradientStyles: FlexProps = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  minHeight: 120,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
} satisfies FlexProps

const GradientContainer = styled(Flex, {
  ...GradientStyles,
  mask: 'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0) 100%)',
  overflow: 'hidden',
})

export const GradientImage = styled(Image, {
  ...GradientStyles,
  borderTopLeftRadius: '$rounded16',
  borderTopRightRadius: '$rounded16',
  opacity: 0.48,
})

const IconStyles = {
  width: 40,
  height: 40,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '$rounded6',
} satisfies FlexProps

const IconContainer = styled(Flex, IconStyles)
const IconImage = styled(Image, IconStyles)

const FeatureRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
})

const FeatureIcon = styled(Flex, {
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
})

export interface ModalFeatureItem {
  icon?: ReactNode
  text: string
  iconUrl?: string
  /** Optional dark mode variant for iconUrl. Falls back to iconUrl if not provided. */
  darkModeIconUrl?: string
}

export interface ModalTemplateButton {
  text: string
  onPress: () => void
  isPrimary?: boolean
  emphasis?: 'primary' | 'secondary' | 'tertiary'
  elementName?: ElementName
}

/**
 * Helper function to render a custom icon from a notification icon link.
 * Supports format: "custom:<iconName>-$<colorToken>" (e.g., "custom:lightning-$accent1")
 *
 * TODO: remove client hard-coding when notification images are uploaded to backend and they start sending valid image URLs.
 */
function renderCustomIcon(iconUrl?: string): ReactNode {
  const { IconComponent, colorToken } = parseCustomIconLink(iconUrl)
  if (!IconComponent || !colorToken) {
    return null
  }
  return <IconComponent size={20} color={colorToken} />
}

interface ModalTemplateProps {
  isOpen: boolean
  name: ModalNameType | string
  onClose: () => void
  backgroundImageUrl?: string
  /** Optional dark mode variant for backgroundImageUrl. Falls back to backgroundImageUrl if not provided. */
  darkModeBackgroundImageUrl?: string
  onBackgroundPress?: () => void
  iconUrl?: string
  /** Optional dark mode variant for iconUrl. Falls back to iconUrl if not provided. */
  darkModeIconUrl?: string
  title: string
  subtitle?: string
  features?: ModalFeatureItem[]
  buttons?: ModalTemplateButton[]
  children?: ReactNode
  maxWidth?: number
}

/**
 * ModalTemplate component
 *
 * A reusable template for rendering modal notifications.
 * Extracted from SolanaPromoModal to be shared across the notification system.
 *
 * Features:
 * - Centered modal with gradient background
 * - Icon, title, and subtitle header
 * - Feature list with icons and text
 * - Action buttons (primary/secondary)
 * - Close button in top-right corner
 * - Fully customizable layout via children prop
 *
 * Used by:
 * - ModalNotification (notification API-driven modals)
 * - SolanaPromoModal (hardcoded promotional modal)
 */
export function ModalTemplate({
  isOpen,
  name,
  onClose,
  backgroundImageUrl,
  darkModeBackgroundImageUrl,
  onBackgroundPress,
  iconUrl,
  darkModeIconUrl,
  title,
  subtitle,
  features = [],
  buttons = [],
  children,
  maxWidth = MODAL_MAX_WIDTH,
}: ModalTemplateProps): JSX.Element {
  // Hide close button on bottom sheet (mobile web)
  const sm = useMedia().sm
  const hideCloseButton = (isWebApp && sm) || isMobileApp
  const isDarkMode = useIsDarkMode()
  const gradientStartColor = isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0)'
  const effectiveBackgroundUrl =
    isDarkMode && darkModeBackgroundImageUrl ? darkModeBackgroundImageUrl : backgroundImageUrl
  const effectiveIconUrl = isDarkMode && darkModeIconUrl ? darkModeIconUrl : iconUrl

  return (
    <Modal
      hideHandlebar
      renderBehindTopInset
      isModalOpen={isOpen}
      name={name as ModalNameType}
      maxWidth={maxWidth}
      padding="$none"
      borderWidth={isDarkMode ? 1 : 0}
      onClose={onClose}
    >
      <Flex p="$spacing24" gap="$spacing24">
        {effectiveBackgroundUrl &&
          (isMobileApp ? (
            <>
              <GradientImage
                source={{ uri: effectiveBackgroundUrl }}
                cursor={onBackgroundPress ? 'pointer' : undefined}
                onPress={onBackgroundPress}
              />
              <LinearGradient
                colors={[gradientStartColor, '$surface1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0, 0.775]}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  height: 120,
                }}
              />
            </>
          ) : (
            <GradientContainer
              backgroundImage={`url(${effectiveBackgroundUrl})`}
              cursor={onBackgroundPress ? 'pointer' : undefined}
              onPress={onBackgroundPress}
            />
          ))}

        {children || (
          <>
            {/* Header */}
            <Flex alignItems="flex-start" gap="$spacing16" pt="$spacing16">
              {effectiveIconUrl &&
                (isMobileApp ? (
                  <IconImage source={{ uri: effectiveIconUrl }} />
                ) : (
                  <IconContainer backgroundImage={`url(${effectiveIconUrl})`} />
                ))}
              <Flex gap="$spacing4">
                <Text variant="subheading1" color="$neutral1">
                  {title}
                </Text>
                {subtitle && (
                  <Text variant="body3" color="$neutral2">
                    {subtitle}
                  </Text>
                )}
              </Flex>
            </Flex>

            {/* Feature list */}
            {features.length > 0 && (
              <Flex gap="$spacing8" mx="$spacing8">
                {features.map((feature, index) => {
                  const effectiveFeatureIconUrl =
                    isDarkMode && feature.darkModeIconUrl ? feature.darkModeIconUrl : feature.iconUrl
                  const customIcon = renderCustomIcon(effectiveFeatureIconUrl)
                  return (
                    <FeatureRow key={index}>
                      {(feature.icon || effectiveFeatureIconUrl) && (
                        <FeatureIcon>
                          {customIcon ||
                            (effectiveFeatureIconUrl ? (
                              <Flex
                                width={20}
                                height={20}
                                backgroundImage={`url(${effectiveFeatureIconUrl})`}
                                backgroundSize="cover"
                                backgroundPosition="center"
                              />
                            ) : (
                              feature.icon
                            ))}
                        </FeatureIcon>
                      )}
                      <Text variant="body3" color="$neutral2">
                        {feature.text}
                      </Text>
                    </FeatureRow>
                  )
                })}
              </Flex>
            )}

            {/* Action buttons */}
            {buttons.length > 0 && (
              <Flex gap="$spacing12">
                {buttons.map((button, index) => (
                  <Trace
                    key={`${button.elementName}-${index}`}
                    logPress
                    element={button.elementName ?? ElementName.ModalButton}
                  >
                    <Flex row>
                      <Button
                        size="medium"
                        emphasis={button.emphasis ?? (button.isPrimary ? 'primary' : 'secondary')}
                        width="100%"
                        minHeight="$spacing48"
                        onPress={button.onPress}
                      >
                        {button.text}
                      </Button>
                    </Flex>
                  </Trace>
                ))}
              </Flex>
            )}
          </>
        )}

        {/* Close button - hidden on bottom sheet (mobile web) */}
        {!hideCloseButton && (
          <IconButton
            position="absolute"
            right="$spacing16"
            top="$spacing16"
            size="small"
            emphasis="secondary"
            icon={<X />}
            p={8}
            scale={0.8}
            onPress={(e) => {
              e.stopPropagation()
              onClose()
            }}
          />
        )}
      </Flex>
    </Modal>
  )
}
