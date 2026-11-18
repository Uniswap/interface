import { Flex, type FlexProps, iconSizes, LinearGradient, spacing, Text, TouchableArea } from '@universe/mycelium'
import { X } from '@universe/mycelium/icons/X'
import { opacify, useShadowPropsShort, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { OnboardingChecklistProgressBar } from 'src/components/home/onboardingChecklist/OnboardingChecklistProgressBar'
import { OnboardingChecklistSheet } from 'src/components/home/onboardingChecklist/OnboardingChecklistSheet'
import { getOnboardingChecklistStepContent } from 'src/components/home/onboardingChecklist/onboardingChecklistSteps'
import { useOnboardingChecklist } from 'src/components/home/onboardingChecklist/useOnboardingChecklist'
import { QUICK_ACTION_BUTTON_WIDTH } from 'src/screens/HomeScreen/HomeScreenQuickActions'
import type { OnboardingChecklistStep } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'

const CARD_WIDTH = 3 * QUICK_ACTION_BUTTON_WIDTH + 2 * spacing.spacing8
const EDGE_FADE_WIDTH = spacing.spacing36
const ICON_BOX_SIZE = iconSizes.icon40
const DISMISS_OFFSET = spacing.spacing16 - 1
const SCROLL_CONTENT_STYLE = { gap: spacing.spacing8, paddingHorizontal: spacing.spacing24 }

export function OnboardingChecklist(props: FlexProps): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const checklist = useOnboardingChecklist()
  const { isVisible, steps, completedCount, isDismissible, openSheet, onStepPress, dismiss } = checklist
  const todoSteps = steps.filter((step) => !step.isDone)
  const onlyTodoStep = todoSteps.length === 1 ? todoSteps[0] : undefined

  if (!isVisible) {
    return null
  }

  return (
    <Flex backgroundColor="$surface2" gap="$spacing16" py="$spacing16" testID={TestID.OnboardingChecklist} {...props}>
      <TouchableArea
        row
        alignItems="center"
        gap="$spacing12"
        px="$spacing24"
        shouldAutomaticallyInjectColors={false}
        testID={TestID.OnboardingChecklistToggle}
        onPress={openSheet}
      >
        <Text flex={1} variant="body3" color="$neutral2">
          {t('onboarding.checklist.title')}
        </Text>
        <OnboardingChecklistProgressBar completedFraction={completedCount / steps.length} />
      </TouchableArea>
      {onlyTodoStep ? (
        <Flex px="$spacing24">
          <StepCard step={onlyTodoStep} onPress={onStepPress} onDismiss={isDismissible ? dismiss : undefined} />
        </Flex>
      ) : (
        <Flex>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SCROLL_CONTENT_STYLE}>
            {todoSteps.map((step) => (
              <StepCard key={step.id} step={step} width={CARD_WIDTH} onPress={onStepPress} />
            ))}
          </ScrollView>
          <Flex position="absolute" top={0} bottom={0} right={0} width={EDGE_FADE_WIDTH} pointerEvents="none">
            <LinearGradient
              colors={[opacify(0, colors.surface2.val), colors.surface2.val]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              width="100%"
              height="100%"
            />
          </Flex>
        </Flex>
      )}
      <OnboardingChecklistSheet checklist={checklist} />
    </Flex>
  )
}

function StepCard({
  step,
  width,
  onPress,
  onDismiss,
}: {
  step: OnboardingChecklistStep
  width?: number
  onPress: (stepId: OnboardingChecklistStep['id']) => void
  onDismiss?: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const shadowProps = useShadowPropsShort()
  const { title, card } = getOnboardingChecklistStepContent(t, step.id)

  if (!card) {
    return null
  }

  const { Icon, description } = card

  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$spacing12"
      width={width}
      p="$spacing16"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface1"
      shouldAutomaticallyInjectColors={false}
      onPress={() => onPress(step.id)}
      {...shadowProps}
    >
      <Flex centered width={ICON_BOX_SIZE} height={ICON_BOX_SIZE} borderRadius="$rounded12" backgroundColor="$accent2">
        <Icon size={iconSizes.icon20} color="$accent1" />
      </Flex>
      <Flex flex={1} gap="$spacing4">
        <Text variant="subheading2" color="$neutral1" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="body3" color="$neutral2" numberOfLines={1}>
          {description}
        </Text>
      </Flex>
      {onDismiss && (
        <TouchableArea
          position="absolute"
          // Offsets start inside the 1px border; the design's 16px is from the outer edge
          top={DISMISS_OFFSET}
          right={DISMISS_OFFSET}
          aria-label={t('common.button.dismiss')}
          hitSlop={spacing.spacing8}
          onPress={onDismiss}
        >
          <X size={iconSizes.icon20} color="$neutral2" />
        </TouchableArea>
      )}
    </TouchableArea>
  )
}
