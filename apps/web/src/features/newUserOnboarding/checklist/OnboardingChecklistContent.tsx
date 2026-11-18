import { Flex, ProgressRing, Text, TouchableArea } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { ChevronsIn } from '@universe/mycelium/icons/ChevronsIn'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import {
  type OnboardingChecklistStep,
  OnboardingChecklistStepId,
} from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { OnboardingChecklistStepStatusIcon } from 'uniswap/src/features/onboarding/checklist/OnboardingChecklistStepStatusIcon'
import type { OnboardingChecklistController } from '~/features/newUserOnboarding/checklist/useOnboardingChecklist'

type ChecklistSize = 'small' | 'large'

const ICON_SIZE: Record<ChecklistSize, number> = { small: 20, large: 24 }
const ARROW_SIZE = 12
const PROGRESS_STROKE_RATIO = 0.15
const LABEL_VARIANT = {
  small: { label: 'body3', todo: 'buttonLabel3' },
  large: { label: 'body1', todo: 'buttonLabel1' },
} as const
const ROW_PADDING = {
  small: { px: '$spacing8', py: '$spacing8' },
  large: { py: '$spacing12' },
} as const

function getStepLabel(t: TFunction, stepId: OnboardingChecklistStepId): string {
  const labels: Record<OnboardingChecklistStepId, string> = {
    [OnboardingChecklistStepId.CreateAccount]: t('onboarding.checklist.step.createAccount'),
    [OnboardingChecklistStepId.FundWallet]: t('onboarding.checklist.step.fundWallet'),
    [OnboardingChecklistStepId.CompleteSwap]: t('onboarding.checklist.step.completeSwap'),
    [OnboardingChecklistStepId.AddBackupLogin]: t('onboarding.checklist.step.addBackupLogin'),
    [OnboardingChecklistStepId.BackupWallet]: t('onboarding.checklist.step.backupWallet'),
    [OnboardingChecklistStepId.ClaimUsername]: t('onboarding.checklist.step.claimUsername'),
  }
  return labels[stepId]
}

export function OnboardingChecklistHeader({
  checklist,
  size,
  showToggle = true,
}: {
  checklist: OnboardingChecklistController
  size: ChecklistSize
  showToggle?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { completedCount, steps, isExpanded, toggleExpanded } = checklist
  const iconSize = ICON_SIZE[size]
  const ToggleIcon = isExpanded ? ChevronsIn : ChevronsOut

  const ring = (
    <ProgressRing
      size={iconSize}
      strokeWidth={iconSize * PROGRESS_STROKE_RATIO}
      progress={completedCount / steps.length}
      color={colors.accent1.val}
    />
  )
  const title = (
    <Text flex={1} variant={LABEL_VARIANT[size].label} color="$neutral2">
      {t('onboarding.checklist.title')}
    </Text>
  )
  const layoutProps = {
    alignItems: 'center',
    gap: '$spacing12',
    px: size === 'small' ? '$spacing8' : undefined,
    py: '$spacing8',
  } as const

  if (!showToggle) {
    // Disabled TouchableArea would recolor the ring
    return (
      <Flex row {...layoutProps}>
        {ring}
        {title}
      </Flex>
    )
  }

  return (
    <TouchableArea
      row
      {...layoutProps}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? t('onboarding.checklist.collapse') : t('onboarding.checklist.expand')}
      testID={TestID.OnboardingChecklistToggle}
      onPress={toggleExpanded}
    >
      {ring}
      {title}
      <ToggleIcon size={iconSize} color="$neutral2" />
    </TouchableArea>
  )
}

export function OnboardingChecklistBody({
  checklist,
  size,
}: {
  checklist: OnboardingChecklistController
  size: ChecklistSize
}): JSX.Element {
  return (
    <>
      <Flex height={1} backgroundColor="$surface3" mx={size === 'small' ? '$spacing8' : undefined} />
      <Flex>
        {checklist.steps.map((step) => (
          <ChecklistStepRow key={step.id} step={step} size={size} onPress={checklist.onStepPress} />
        ))}
      </Flex>
    </>
  )
}

function ChecklistStepRow({
  step,
  size,
  onPress,
}: {
  step: OnboardingChecklistStep
  size: ChecklistSize
  onPress: (stepId: OnboardingChecklistStepId) => void
}): JSX.Element {
  const { t } = useTranslation()
  const iconSize = ICON_SIZE[size]
  const label = getStepLabel(t, step.id)
  const rowProps = { row: true, alignItems: 'center', gap: '$spacing12', ...ROW_PADDING[size] } as const

  if (step.isDone) {
    return (
      <Flex {...rowProps}>
        <OnboardingChecklistStepStatusIcon isDone size={iconSize} />
        <Text flex={1} variant={LABEL_VARIANT[size].label} color="$neutral3" textDecorationLine="line-through">
          {label}
        </Text>
      </Flex>
    )
  }

  return (
    <TouchableArea
      {...rowProps}
      borderRadius="$rounded8"
      hoverStyle={{ backgroundColor: '$surface2' }}
      onPress={() => onPress(step.id)}
    >
      <OnboardingChecklistStepStatusIcon isDone={false} size={iconSize} />
      <Text flex={1} variant={LABEL_VARIANT[size].todo} color="$neutral1">
        {label}
      </Text>
      <ArrowRight size={ARROW_SIZE} color="$neutral2" />
    </TouchableArea>
  )
}
