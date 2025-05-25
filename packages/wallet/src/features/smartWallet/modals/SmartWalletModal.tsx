import React from 'react'
import { Button, ButtonEmphasis, ButtonVariant, Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { isExtension, isMobileApp } from 'utilities/src/platform'

export interface SmartWalletModalProps {
  isOpen: boolean
  onClose: () => void
  icon: React.ReactNode
  title: string
  subtext: string | React.ReactNode
  learnMoreUrl?: string
  modalName: ModalNameType
  primaryButtonText: string
  primaryButtonOnClick: () => void
  primaryButtonVariant?: ButtonVariant
  primaryButtonEmphasis?: ButtonEmphasis
  secondaryButtonText?: string
  secondaryButtonOnClick?: () => void
  secondaryButtonVariant?: ButtonVariant
  secondaryButtonEmphasis?: ButtonEmphasis
  children?: React.ReactNode
  alignment?: 'top' | 'center'
  zIndex?: number
}

export function SmartWalletModal({
  isOpen,
  onClose,
  icon,
  title,
  subtext,
  learnMoreUrl,
  modalName,
  primaryButtonText,
  primaryButtonOnClick,
  primaryButtonVariant = 'branded',
  primaryButtonEmphasis,
  secondaryButtonText,
  secondaryButtonOnClick,
  secondaryButtonVariant = 'default',
  secondaryButtonEmphasis = 'secondary',
  alignment = isExtension ? 'top' : undefined,
  children,
  zIndex,
}: SmartWalletModalProps): JSX.Element {
  return (
    <Modal alignment={alignment} isModalOpen={isOpen} name={modalName} zIndex={zIndex} onClose={onClose}>
      <Flex
        flexDirection="column"
        alignItems="center"
        p="$spacing12"
        mb={isMobileApp ? '$spacing36' : undefined}
        gap="$spacing8"
      >
        {icon}
        <Text variant="subheading2" color="$neutral1">
          {title}
        </Text>
        {typeof subtext === 'string' ? (
          <Text variant="body3" color="$neutral2" textAlign="center">
            {subtext}
          </Text>
        ) : (
          subtext
        )}
        {learnMoreUrl && <LearnMoreLink url={learnMoreUrl} textColor="$neutral1" textVariant="body3" />}
        {children && <Flex>{children}</Flex>}
        <Flex gap="$spacing8" width="100%" mt="$spacing12">
          <Button
            variant={primaryButtonVariant}
            emphasis={primaryButtonEmphasis}
            minHeight="$spacing48"
            onPress={primaryButtonOnClick}
          >
            {primaryButtonText}
          </Button>
          {secondaryButtonText && secondaryButtonOnClick && (
            <Button
              variant={secondaryButtonVariant}
              emphasis={secondaryButtonEmphasis}
              minHeight="$spacing48"
              onPress={secondaryButtonOnClick}
            >
              {secondaryButtonText}
            </Button>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
