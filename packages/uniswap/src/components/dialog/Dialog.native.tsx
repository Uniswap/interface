import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { DialogButtons } from 'uniswap/src/components/dialog/DialogButtons'
import { DialogContent } from 'uniswap/src/components/dialog/DialogContent'
import type { DialogProps } from 'uniswap/src/components/dialog/DialogProps'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { BehaviorType, useDialogVisibility } from 'uniswap/src/components/dialog/hooks/useDialogVisibility'
import { Modal } from 'uniswap/src/components/modals/Modal'
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
  alignment,
  children,
  footer,
  textAlign = 'center',
  displayHelpCTA = false,
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

  const hasShouldShowBecomeFalse = useHasValueBecomeTruthy(shouldShow === false)
  const hasDialogOpened = useHasValueBecomeTruthy(isOpen)

  useEffect(() => {
    if ((hasShouldShowBecomeFalse || (hasDialogOpened && shouldShow === false)) && isOpen) {
      onClose()
    }
  }, [hasShouldShowBecomeFalse, hasDialogOpened, shouldShow, isOpen, onClose])

  if (isLoading) {
    return <></>
  }

  if (shouldShow === false) {
    return <></>
  }

  const dialogContent = (
    <Flex flexDirection="column" px="$spacing24" pb="$padding36" gap="$gap16">
      {displayHelpCTA && <GetHelpHeader closeModal={onClose} />}
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
    </Flex>
  )

  if (skipModalWrapper) {
    return (
      <Flex pt="$padding16" gap="$gap16">
        {dialogContent}
      </Flex>
    )
  }

  return (
    <Modal alignment={alignment} isModalOpen={isOpen} name={modalName} pt="$padding16" gap="$gap16" onClose={onClose}>
      {dialogContent}
    </Modal>
  )
}
