import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { DialogButtons } from 'uniswap/src/components/dialog/DialogButtons'
import { DialogContent } from 'uniswap/src/components/dialog/DialogContent'
import type { DialogProps } from 'uniswap/src/components/dialog/DialogProps'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { BehaviorType, useDialogVisibility } from 'uniswap/src/components/dialog/hooks/useDialogVisibility'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { isExtensionApp } from 'utilities/src/platform'
import { useHasValueBecomeTruthy } from 'utilities/src/react/useHasValueBecomeTruthy'

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
  primaryButton,
  secondaryButton,
  isPrimaryButtonLoading,
  buttonContainerProps,
  alignment = isExtensionApp ? 'top' : undefined,
  children,
  footer,
  textAlign = 'center',
  displayHelpCTA = false,
  getHelpUrl,
  iconBackgroundColor,
  visibilityId,
  dialogPreferencesService,
  skipModalWrapper = false,
}: DialogProps): JSX.Element {
  const { t } = useTranslation()
  const { shouldShow, isLoading, dontShowAgain, setDontShowAgain, resetDontShowAgain } = useDialogVisibility(
    visibilityId && dialogPreferencesService
      ? {
          visibilityId,
          dialogPreferencesService,
          isOpen,
          behaviorType: BehaviorType.DontShowAgain,
        }
      : {
          isOpen,
        },
  )

  // Detects when shouldShow transitions from undefined (loading) to false (user preference set to "don't show again")
  const hasShouldShowBecomeFalse = useHasValueBecomeTruthy(shouldShow === false)
  const hasDialogOpened = useHasValueBecomeTruthy(isOpen)

  // Call onClose when shouldShow transitions to false OR when dialog opens with shouldShow already false
  useEffect(() => {
    if ((hasShouldShowBecomeFalse || (hasDialogOpened && shouldShow === false)) && isOpen) {
      onClose()
    }
  }, [hasShouldShowBecomeFalse, hasDialogOpened, shouldShow, isOpen, onClose])

  // Wait for visibility check if using preferences
  if (isLoading) {
    return <></>
  }

  // Don't render the modal if it shouldn't be shown
  if (shouldShow === false) {
    return <></>
  }

  const dialogContent = (
    <>
      {displayHelpCTA && <GetHelpHeader closeModal={onClose} link={getHelpUrl} />}
      <DialogContent
        icon={icon}
        title={title}
        titleColor={titleColor}
        subtext={subtext}
        learnMoreUrl={learnMoreUrl}
        learnMoreTextColor={learnMoreTextColor}
        learnMoreTextVariant={learnMoreTextVariant}
        textAlign={textAlign}
        iconBackgroundColor={iconBackgroundColor}
        footer={footer}
      >
        {children}
      </DialogContent>
      {visibilityId && dialogPreferencesService && (
        <Flex centered width="100%" pb="$padding8">
          <LabeledCheckbox
            checked={dontShowAgain}
            text={
              <Text variant="buttonLabel3" color="$neutral2">
                {t('common.dialog.dontShowAgain')}
              </Text>
            }
            size="$icon.16"
            gap="$spacing8"
            onCheckPressed={() => (dontShowAgain ? resetDontShowAgain() : setDontShowAgain())}
          />
        </Flex>
      )}
      <DialogButtons
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        isPrimaryButtonLoading={isPrimaryButtonLoading}
        buttonContainerProps={buttonContainerProps}
      />
    </>
  )

  if (skipModalWrapper) {
    return (
      <Flex pt="$padding16" gap="$gap16">
        {dialogContent}
      </Flex>
    )
  }

  return (
    <Modal
      alignment={alignment}
      isModalOpen={isOpen}
      name={modalName}
      pt="$padding16"
      paddingX={isExtensionApp ? '$spacing12' : undefined}
      pb={isExtensionApp ? '$spacing12' : undefined}
      gap="$gap16"
      maxWidth={isExtensionApp ? 310 : undefined}
      onClose={onClose}
    >
      {dialogContent}
    </Modal>
  )
}
