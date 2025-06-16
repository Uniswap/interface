import React from 'react'
import { Trans } from 'react-i18next'
import { Button, ButtonEmphasis, ButtonVariant, Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isExtension } from 'utilities/src/platform'

export interface SmartWalletModalProps {
  isOpen: boolean
  onClose: () => void
  icon?: React.ReactNode
  video?: React.ReactNode
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
  hideHandlebar?: boolean
  isDismissible?: boolean
}

export function SmartWalletModal({
  isOpen,
  onClose,
  icon,
  video,
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
  hideHandlebar = false,
  children,
  zIndex,
}: SmartWalletModalProps): JSX.Element {
  return (
    <Modal
      renderBehindTopInset
      alignment={alignment}
      isModalOpen={isOpen}
      name={modalName}
      hideHandlebar={hideHandlebar}
      isDismissible={false}
      zIndex={zIndex}
      onClose={onClose}
    >
      <Flex
        flexDirection="column"
        alignItems="center"
        px={isExtension ? null : '$spacing24'}
        mb={isExtension ? null : '$spacing48'}
        gap="$spacing16"
        pt={isExtension ? null : video ? '$spacing24' : '$spacing12'}
      >
        {video ? video : icon}
        <Flex flexDirection="column" alignItems="center" gap="$gap8">
          <Text variant="subheading2" color="$neutral1">
            {title}
          </Text>
          {typeof subtext === 'string' ? (
            <Text variant="body3" color="$neutral2" textAlign="center">
              <Trans
                components={{
                  highlight: learnMoreUrl ? (
                    <LearnMoreLink display="inline-flex" url={learnMoreUrl} textColor="$neutral1" textVariant="body3" />
                  ) : (
                    <Text variant="body3" color="$neutral2" textAlign="center" />
                  ),
                }}
                i18nKey={subtext}
              />
            </Text>
          ) : (
            subtext
          )}
        </Flex>
        {children && <Flex mb="$spacing12">{children}</Flex>}
        <Flex gap="$spacing8" width="100%" pt="$padding8">
          <Button
            variant={primaryButtonVariant}
            emphasis={primaryButtonEmphasis}
            minHeight="$spacing48"
            testID={TestID.SmartWalletUpgradeModalEnable}
            onPress={primaryButtonOnClick}
          >
            {primaryButtonText}
          </Button>
          {secondaryButtonText && secondaryButtonOnClick && (
            <Button
              variant={secondaryButtonVariant}
              emphasis={secondaryButtonEmphasis}
              minHeight="$spacing48"
              testID={TestID.SmartWalletUpgradeModalMaybeLater}
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
