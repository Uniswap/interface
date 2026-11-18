import { Button, Flex, iconSizes, Separator, Text, TouchableArea } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { useTranslation } from 'react-i18next'
import { OnboardingChecklistProgressBar } from 'src/components/home/onboardingChecklist/OnboardingChecklistProgressBar'
import { getOnboardingChecklistStepContent } from 'src/components/home/onboardingChecklist/onboardingChecklistSteps'
import type { OnboardingChecklistController } from 'src/components/home/onboardingChecklist/useOnboardingChecklist'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type {
  OnboardingChecklistStep,
  OnboardingChecklistStepId,
} from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { OnboardingChecklistStepStatusIcon } from 'uniswap/src/features/onboarding/checklist/OnboardingChecklistStepStatusIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function OnboardingChecklistSheet({ checklist }: { checklist: OnboardingChecklistController }): JSX.Element {
  const { t } = useTranslation()
  const { steps, completedCount, isDismissible, isSheetOpen, closeSheet, onStepPress, dismiss } = checklist

  return (
    <Modal name={ModalName.OnboardingChecklist} isModalOpen={isSheetOpen} onClose={closeSheet}>
      <Flex gap="$spacing24" px="$spacing24" pb="$spacing24">
        <Flex gap="$spacing12">
          <Flex row alignItems="center" gap="$spacing12" py="$spacing8">
            <Text flex={1} variant="body1" color="$neutral2">
              {t('onboarding.checklist.title')}
            </Text>
            <OnboardingChecklistProgressBar completedFraction={completedCount / steps.length} />
          </Flex>
          <Separator />
          <Flex>
            {steps.map((step) => (
              <StepRow key={step.id} step={step} onPress={onStepPress} />
            ))}
          </Flex>
        </Flex>
        {isDismissible && (
          <Flex row>
            <Button size="medium" emphasis="secondary" onPress={dismiss}>
              {t('common.button.dismiss')}
            </Button>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}

function StepRow({
  step,
  onPress,
}: {
  step: OnboardingChecklistStep
  onPress: (stepId: OnboardingChecklistStepId) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { title } = getOnboardingChecklistStepContent(t, step.id)

  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$spacing12"
      py="$spacing12"
      borderRadius="$rounded8"
      disabled={step.isDone}
      // Disabled injection would override the done colors
      shouldAutomaticallyInjectColors={!step.isDone}
      onPress={() => onPress(step.id)}
    >
      <OnboardingChecklistStepStatusIcon isDone={step.isDone} size={iconSizes.icon24} />
      <Text
        flex={1}
        variant="body1"
        color={step.isDone ? '$neutral3' : '$neutral1'}
        textDecorationLine={step.isDone ? 'line-through' : 'none'}
      >
        {title}
      </Text>
      {!step.isDone && <ArrowRight size={iconSizes.icon24} color="$neutral2" />}
    </TouchableArea>
  )
}
