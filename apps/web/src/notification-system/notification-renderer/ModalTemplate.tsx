import { ReactNode } from 'react'
import { Button, Flex, IconButton, styled, Text, useMedia } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, type ModalNameType } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isWebApp } from 'utilities/src/platform'

const MODAL_MAX_WIDTH = 440

const GradientContainer = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  borderTopLeftRadius: '$rounded16',
  borderTopRightRadius: '$rounded16',
  minHeight: 120,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  mask: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
})

const IconContainer = styled(Flex, {
  width: 40,
  height: 40,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '$rounded6',
})

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
}: ModalTemplateProps) {
  // Hide close button on bottom sheet (mobile web)
  const sm = useMedia().sm
  const hideCloseButton = isWebApp && sm

  return (
    <Modal isModalOpen={isOpen} name={name as ModalNameType} onClose={onClose} maxWidth={maxWidth} padding="$none">
      <Flex p="$spacing24" gap="$spacing24">
        {backgroundImageUrl && (
          <GradientContainer
            backgroundImage={`url(${backgroundImageUrl})`}
            onPress={onBackgroundPress}
            cursor={onBackgroundPress ? 'pointer' : undefined}
          />
        )}

        {children || (
          <>
            {/* Header */}
            <Flex alignItems="flex-start" gap="$spacing16" pt="$spacing16">
              {iconUrl && <IconContainer backgroundImage={`url(${iconUrl})`} />}
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
                {features.map((feature, index) => (
                  <FeatureRow key={index}>
                    {(feature.icon || feature.iconUrl) && (
                      <FeatureIcon>
                        {feature.iconUrl ? (
                          <Flex
                            width={20}
                            height={20}
                            backgroundImage={`url(${feature.iconUrl})`}
                            backgroundSize="cover"
                            backgroundPosition="center"
                          />
                        ) : (
                          feature.icon
                        )}
                      </FeatureIcon>
                    )}
                    <Text variant="body3" color="$neutral2">
                      {feature.text}
                    </Text>
                  </FeatureRow>
                ))}
              </Flex>
            )}

            {/* Action buttons */}
            {buttons.length > 0 && (
              <Flex gap="$spacing12">
                {buttons.map((button, index) => (
                  <Trace
                    logPress
                    element={button.elementName ?? ElementName.ModalButton}
                    key={`${button.elementName}-${index}`}
                  >
                    <Button
                      size="large"
                      emphasis={button.emphasis ?? (button.isPrimary ? 'primary' : 'secondary')}
                      onPress={button.onPress}
                      width="100%"
                      minHeight="$spacing48"
                    >
                      {button.text}
                    </Button>
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
            onPress={(e) => {
              e.stopPropagation()
              onClose()
            }}
            icon={<X />}
            p={8}
            scale={0.8}
          />
        )}
      </Flex>
    </Modal>
  )
}
