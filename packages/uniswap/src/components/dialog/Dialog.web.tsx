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
  alignment = isExtensionApp ? 'top' : undefined,
  children,
  textAlign = 'center',
  displayHelpCTA = false,
  hasIconBackground = false,
}: DialogProps): JSX.Element {
  return (
    <Modal alignment={alignment} isModalOpen={isOpen} name={modalName} onClose={onClose}>
      {displayHelpCTA && <GetHelpHeader closeModal={onClose} />}
      <Flex
        flexDirection="column"
        alignItems={textAlign === 'center' ? 'center' : 'flex-start'}
        p="$spacing12"
        gap="$spacing8"
      >
        {hasIconBackground ? (
          <Flex
            backgroundColor="$surface3"
            borderRadius="$rounded12"
            height="$spacing48"
            width="$spacing48"
            alignItems="center"
            justifyContent="center"
            mb="$spacing4"
            data-testid="dialog-icon"
          >
            {icon}
          </Flex>
        ) : (
          icon
        )}
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
            loading={isPrimaryButtonLoading}
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
