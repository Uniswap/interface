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
import type { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { Chart } from 'ui/src/components/icons/Chart'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { EthMini } from 'ui/src/components/icons/EthMini'
import { Gas } from 'ui/src/components/icons/Gas'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
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
}

export interface ModalTemplateButton {
  text: string
  onPress: () => void
  isPrimary?: boolean
  emphasis?: 'primary' | 'secondary' | 'tertiary'
  elementName?: ElementName
}

const CUSTOM_ICON_MAP: Record<string, GeneratedIcon> = {
  lightning: Lightning,
  wallet: Wallet,
  chart: Chart,
  gas: Gas,
  'coin-convert': CoinConvert,
  ethereum: EthMini,
}

/**
 * Helper function to check if iconUrl is a custom icon string (format: "custom:<iconName>-<colorToken>")
 * and return the corresponding React component instead of using a background image.
 *
 * TODO: remove client hard-coding when notification images are uploaded to backend and they start sending valid image URLs.
 *
 * @example
 * getCustomIconComponent("custom:lightning-$accent1") // Returns <Lightning size={20} color="$accent1" />
 * getCustomIconComponent("custom:wallet-$neutral2") // Returns <Wallet size={20} color="$neutral2" />
 */
function getCustomIconComponent(iconUrl?: string): ReactNode {
  if (!iconUrl || typeof iconUrl !== 'string' || !iconUrl.startsWith('custom:')) {
    return null
  }

  // Parse the format: custom:<iconName>-<colorToken>
  const customPart = iconUrl.slice(7) // Remove "custom:" prefix
  const lastDashIndex = customPart.lastIndexOf('-')

  if (lastDashIndex === -1) {
    return null
  }

  const iconName = customPart.slice(0, lastDashIndex)
  const colorToken = customPart.slice(lastDashIndex + 1)

  const IconComponent = CUSTOM_ICON_MAP[iconName]
  return IconComponent ? <IconComponent size={20} color={colorToken} /> : null
}

interface ModalTemplateProps {
  isOpen: boolean
  name: ModalNameType | string
  onClose: () => void
  backgroundImageUrl?: string
  onBackgroundPress?: () => void
  iconUrl?: string
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
  onBackgroundPress,
  iconUrl,
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
        {backgroundImageUrl &&
          (isMobileApp ? (
            <>
              <GradientImage
                source={{ uri: backgroundImageUrl }}
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
              backgroundImage={`url(${backgroundImageUrl})`}
              cursor={onBackgroundPress ? 'pointer' : undefined}
              onPress={onBackgroundPress}
            />
          ))}

        {children || (
          <>
            {/* Header */}
            <Flex alignItems="flex-start" gap="$spacing16" pt="$spacing16">
              {iconUrl &&
                (isMobileApp ? (
                  <IconImage source={{ uri: iconUrl }} />
                ) : (
                  <IconContainer backgroundImage={`url(${iconUrl})`} />
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
                  const customIcon = getCustomIconComponent(feature.iconUrl)
                  return (
                    <FeatureRow key={index}>
                      {(feature.icon || feature.iconUrl) && (
                        <FeatureIcon>
                          {customIcon ||
                            (feature.iconUrl ? (
                              <Flex
                                width={20}
                                height={20}
                                backgroundImage={`url(${feature.iconUrl})`}
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
