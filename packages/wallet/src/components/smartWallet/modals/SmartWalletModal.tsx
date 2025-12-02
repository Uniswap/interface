import React from 'react'
import { Trans } from 'react-i18next'
import { Button, ButtonEmphasis, ButtonVariant, Flex, GetThemeValueForKey, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isExtensionApp } from 'utilities/src/platform'

export interface SmartWalletModalProps {
  isOpen: boolean
  onClose: () => void
  icon?: React.ReactNode
  video?: React.ReactNode
  title: string
  titleIsLoading?: boolean
  titleLoadingPlaceholderText?: string
  subtext: string | React.ReactNode
  learnMoreUrl?: string
  modalName: ModalNameType
  primaryButtonText: string
  primaryButtonOnClick: () => void
  primaryButtonVariant?: ButtonVariant
  primaryButtonEmphasis?: ButtonEmphasis
  primaryButtonDisabled?: boolean
  primaryButtonLoading?: boolean
  secondaryButtonText?: string
  secondaryButtonOnClick?: () => void
  secondaryButtonVariant?: ButtonVariant
  secondaryButtonEmphasis?: ButtonEmphasis
  children?: React.ReactNode
  alignment?: 'top' | 'center'
  zIndex?: number
  hideHandlebar?: boolean
  isDismissible?: boolean
  iconBackgroundColor?: GetThemeValueForKey<'backgroundColor'>
  horizontalAlignment?: 'left' | 'center'
  horizontalButtons?: boolean
}

export function SmartWalletModal({
  isOpen,
  onClose,
  icon,
  iconBackgroundColor,
  video,
  title,
  titleIsLoading,
  titleLoadingPlaceholderText,
  subtext,
  learnMoreUrl,
  modalName,
  primaryButtonText,
  primaryButtonOnClick,
  primaryButtonVariant = 'branded',
  primaryButtonEmphasis,
  primaryButtonDisabled,
  primaryButtonLoading,
  secondaryButtonText,
  secondaryButtonOnClick,
  secondaryButtonVariant = 'default',
  secondaryButtonEmphasis = 'secondary',
  alignment = isExtensionApp ? 'top' : undefined,
  hideHandlebar = false,
  isDismissible = true,
  children,
  zIndex,
  horizontalButtons = false,
  horizontalAlignment = 'center',
}: SmartWalletModalProps): JSX.Element {
  return (
    <Modal
      renderBehindTopInset
      alignment={alignment}
      isModalOpen={isOpen}
      name={modalName}
      hideHandlebar={hideHandlebar}
      isDismissible={isDismissible}
      zIndex={zIndex}
      onClose={onClose}
    >
      <Flex
        flexDirection="column"
        alignItems={horizontalAlignment === 'left' ? 'flex-start' : 'center'}
        px={isExtensionApp ? null : '$spacing24'}
        mb={isExtensionApp ? null : '$spacing24'}
        gap="$spacing16"
        pt={isExtensionApp ? null : hideHandlebar ? '$spacing24' : '$spacing12'} // handlebar already has padding bottom 12px
      >
        {video ? (
          video
        ) : (
          <Flex
            centered
            backgroundColor={iconBackgroundColor}
            borderRadius="$rounded12"
            height="$spacing48"
            width="$spacing48"
            mt={isExtensionApp ? '$spacing8' : '$none'}
          >
            {icon}
          </Flex>
        )}
        <Flex flexDirection="column" alignItems={horizontalAlignment === 'left' ? 'flex-start' : 'center'} gap="$gap8">
          <Text
            variant={isExtensionApp ? 'subheading2' : 'subheading1'}
            color="$neutral1"
            textAlign={horizontalAlignment}
            loading={titleIsLoading}
            loadingPlaceholderText={titleLoadingPlaceholderText}
          >
            {title}
          </Text>
          {typeof subtext === 'string' ? (
            <Text variant="body3" color="$neutral2" textAlign={horizontalAlignment}>
              <Trans
                components={{
                  highlight: learnMoreUrl ? (
                    <LearnMoreLink display="inline-flex" url={learnMoreUrl} textColor="$neutral1" textVariant="body3" />
                  ) : (
                    <Text variant="body3" color="$neutral2" textAlign={horizontalAlignment} />
                  ),
                }}
                i18nKey={subtext}
              />
            </Text>
          ) : (
            subtext
          )}
        </Flex>
        {children && (
          <Flex flexGrow={1} flexDirection="row" mt="$spacing8" alignSelf="stretch">
            {children}
          </Flex>
        )}
        <Flex
          gap="$spacing8"
          flexDirection={horizontalButtons ? 'row-reverse' : 'column'}
          alignSelf="stretch"
          mt="$spacing8"
        >
          <Flex row flexGrow={1}>
            <Button
              variant={primaryButtonVariant}
              emphasis={primaryButtonEmphasis}
              testID={TestID.SmartWalletUpgradeModalEnable}
              isDisabled={primaryButtonDisabled}
              loading={primaryButtonLoading}
              flexGrow={1}
              shouldAnimateBetweenLoadingStates={false}
              onPress={primaryButtonOnClick}
            >
              {primaryButtonText}
            </Button>
          </Flex>
          {secondaryButtonText && secondaryButtonOnClick && (!horizontalButtons || !primaryButtonLoading) && (
            <Flex key="secondary-button" row flexGrow={1}>
              <Button
                variant={secondaryButtonVariant}
                emphasis={secondaryButtonEmphasis}
                testID={TestID.SmartWalletUpgradeModalMaybeLater}
                flexGrow={1}
                onPress={secondaryButtonOnClick}
              >
                {secondaryButtonText}
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
