import { Button, Flex, Text } from 'ui/src'
import type { DialogProps } from 'uniswap/src/components/dialog/DialogProps'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { isExtensionApp } from 'utilities/src/platform'

export function Dialog({
  isOpen,
  onClose,
  icon,
  title,
  titleColor,
  subtext,
  learnMoreUrl,
  learnMoreTextColor = '$neutral1',
  learnMoreTextVariant = 'body3',
  modalName,
  primaryButtonText,
  primaryButtonOnPress,
  primaryButtonVariant = 'default',
  primaryButtonEmphasis = 'primary',
  isPrimaryButtonLoading,
  secondaryButtonText,
  secondaryButtonOnPress,
  secondaryButtonVariant = 'default',
  secondaryButtonEmphasis = 'secondary',
  buttonContainerProps,
  alignment = isExtensionApp ? 'top' : undefined,
  children,
  footer,
  textAlign = 'center',
  displayHelpCTA = false,
  iconBackgroundColor,
}: DialogProps): JSX.Element {
  return (
    <Modal
      alignment={alignment}
      isModalOpen={isOpen}
      name={modalName}
      pt="$padding16"
      paddingX={isExtensionApp ? '$spacing12' : undefined}
      pb={isExtensionApp ? '$spacing12' : undefined}
      gap="$gap24"
      maxWidth={isExtensionApp ? 310 : undefined}
      onClose={onClose}
    >
      {displayHelpCTA && <GetHelpHeader closeModal={onClose} />}
      <Flex flexDirection="column" alignItems={textAlign === 'center' ? 'center' : 'flex-start'} gap="$spacing16">
        <Flex
          backgroundColor={iconBackgroundColor ?? '$surface2'}
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
          alignItems="center"
          justifyContent="center"
          data-testid="dialog-icon"
        >
          {icon}
        </Flex>
        <Flex gap="$spacing8" alignItems={textAlign === 'center' ? 'center' : 'flex-start'}>
          <Text variant="subheading1" color={titleColor ?? '$neutral1'}>
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
        </Flex>
        {children && (
          <Flex
            width="100%"
            borderRadius="$rounded12"
            backgroundColor="$surface2"
            borderWidth="$spacing1"
            borderColor="$surface3"
            px="$spacing16"
            py="$spacing12"
          >
            {children}
          </Flex>
        )}
        {footer}
      </Flex>
      <Flex gap="$spacing8" width="100%" flexDirection="row" {...buttonContainerProps}>
        {secondaryButtonText && secondaryButtonOnPress && (
          <Button
            variant={secondaryButtonVariant}
            emphasis={secondaryButtonEmphasis}
            minHeight="$spacing36"
            onPress={secondaryButtonOnPress}
          >
            {secondaryButtonText}
          </Button>
        )}
        {primaryButtonText && primaryButtonOnPress && (
          <Button
            variant={primaryButtonVariant}
            emphasis={primaryButtonEmphasis}
            minHeight="$spacing36"
            loading={isPrimaryButtonLoading}
            onPress={primaryButtonOnPress}
          >
            {primaryButtonText}
          </Button>
        )}
      </Flex>
    </Modal>
  )
}
