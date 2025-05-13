import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import React from 'react'
import { Button, ButtonEmphasis, ButtonVariant, Flex, FlexProps, Text, TextProps } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { isExtension } from 'utilities/src/platform'

interface DialogV2Props {
  isOpen: boolean
  onClose: () => void
  icon: React.ReactNode
  title: string
  subtext: string | React.ReactNode
  learnMoreUrl?: string
  learnMoreTextColor?: string
  learnMoreTextVariant?: TextProps['variant']
  modalName: ModalNameType
  primaryButtonText: string
  primaryButtonOnClick: () => void
  primaryButtonVariant?: ButtonVariant
  primaryButtonEmphasis?: ButtonEmphasis
  isPrimaryButtonLoading?: boolean
  secondaryButtonText?: string
  secondaryButtonOnClick?: () => void
  secondaryButtonVariant?: ButtonVariant
  secondaryButtonEmphasis?: ButtonEmphasis
  buttonContainerProps?: FlexProps
  children?: React.ReactNode
  alignment?: 'top' | 'center'
  displayHelpCTA?: boolean
  textAlign?: 'center' | 'left'
}

export function DialogV2({
  isOpen,
  onClose,
  icon,
  title,
  subtext,
  learnMoreUrl,
  learnMoreTextColor = '$neutral1',
  learnMoreTextVariant = 'body3',
  modalName,
  primaryButtonText,
  primaryButtonOnClick,
  primaryButtonVariant = 'branded',
  primaryButtonEmphasis,
  isPrimaryButtonLoading,
  secondaryButtonText,
  secondaryButtonOnClick,
  secondaryButtonVariant = 'default',
  secondaryButtonEmphasis = 'secondary',
  buttonContainerProps,
  alignment = isExtension ? 'top' : undefined,
  children,
  displayHelpCTA = false,
  textAlign = 'center',
}: DialogV2Props): JSX.Element {
  return (
    <Modal alignment={alignment} isModalOpen={isOpen} name={modalName} onClose={onClose}>
      {displayHelpCTA && <GetHelpHeader closeModal={onClose} />}
      <Flex
        flexDirection="column"
        alignItems={textAlign === 'center' ? 'center' : 'flex-start'}
        p="$spacing12"
        gap="$spacing8"
      >
        {icon}
        <Text variant="subheading1" color="$neutral1" mt="$spacing8">
          {title}
        </Text>
        {typeof subtext === 'string' ? (
          <Text variant="body3" color="$neutral2" textAlign={textAlign}>
            {subtext}
          </Text>
        ) : (
          subtext
        )}
        {learnMoreUrl && (
          <LearnMoreLink url={learnMoreUrl} textColor={learnMoreTextColor} textVariant={learnMoreTextVariant} />
        )}
        {children}
        <Flex gap="$spacing8" width="100%" mt="$spacing16" {...buttonContainerProps}>
          <Button
            variant={primaryButtonVariant}
            emphasis={primaryButtonEmphasis}
            minHeight="$spacing48"
            onPress={primaryButtonOnClick}
            loading={isPrimaryButtonLoading}
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
