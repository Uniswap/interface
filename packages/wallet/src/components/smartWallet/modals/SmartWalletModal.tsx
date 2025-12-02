import React from 'react'
import { Trans } from 'react-i18next'
import { Button, Flex, GetThemeValueForKey, Text } from 'ui/src'
import { ButtonConfig as DialogButtonConfig } from 'uniswap/src/components/dialog/DialogButtons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isExtensionApp } from 'utilities/src/platform'

type ButtonConfig =
  | (Pick<DialogButtonConfig, 'text' | 'variant' | 'emphasis'> & {
      onClick: () => void
      disabled?: boolean
      loading?: boolean
    })
  | { text?: never; onClick?: never; variant?: never; emphasis?: never; disabled?: never; loading?: never }

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
  primaryButton: ButtonConfig
  secondaryButton?: ButtonConfig
  children?: React.ReactNode
  alignment?: 'top' | 'center'
  zIndex?: number
  hideHandlebar?: boolean
  isDismissible?: boolean
  iconBackgroundColor?: GetThemeValueForKey<'backgroundColor'>
  horizontalAlignment?: 'left' | 'center'
  horizontalButtons?: boolean
}

// eslint-disable-next-line complexity
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
  primaryButton,
  secondaryButton,
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
          {primaryButton.text && (
            <Flex row flexGrow={1}>
              <Button
                variant={primaryButton.variant ?? 'branded'}
                emphasis={primaryButton.emphasis}
                testID={TestID.SmartWalletUpgradeModalEnable}
                isDisabled={primaryButton.disabled}
                loading={primaryButton.loading}
                flexGrow={1}
                shouldAnimateBetweenLoadingStates={false}
                onPress={primaryButton.onClick}
              >
                {primaryButton.text}
              </Button>
            </Flex>
          )}
          {secondaryButton?.text && (!horizontalButtons || !primaryButton.loading) && (
            <Flex key="secondary-button" row flexGrow={1}>
              <Button
                variant={secondaryButton.variant ?? 'default'}
                emphasis={secondaryButton.emphasis ?? 'secondary'}
                testID={TestID.SmartWalletUpgradeModalMaybeLater}
                flexGrow={1}
                onPress={secondaryButton.onClick}
              >
                {secondaryButton.text}
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
