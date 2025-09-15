import { useStickyHeaderBorder } from 'hooks/useStickyHeaderBorder'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { assert } from 'utilities/src/errors'

interface PoolProgressStep {
  label: string
  active: boolean
  onPress?: () => void
}

export const SIDEBAR_WIDTH = 360

export function PoolProgressIndicator({ steps }: { steps: PoolProgressStep[] }) {
  const { t } = useTranslation()
  assert(steps.length > 0, 'PoolProgressIndicator: steps must have at least one step')

  return (
    <Flex
      width={SIDEBAR_WIDTH}
      alignSelf="flex-start"
      $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT + 25 }}
      borderRadius="$rounded24"
      py="$padding8"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$padding16"
    >
      {steps.map((step, index) => (
        <Fragment key={step.label + index}>
          <Flex
            row
            gap="$gap12"
            alignItems="center"
            onPress={step.onPress}
            {...(step.onPress ? ClickableTamaguiStyle : {})}
          >
            <Flex
              height="$spacing32"
              width="$spacing32"
              borderRadius="$roundedFull"
              backgroundColor={step.active ? '$neutral1' : '$surface3'}
              alignItems="center"
              justifyContent="center"
            >
              <Text variant="subheading2" color={step.active ? '$surface1' : '$neutral2'} userSelect="none">
                {index + 1}
              </Text>
            </Flex>
            <Flex shrink gap="$spacing2">
              <Text variant="body3" color={step.active ? '$neutral2' : '$neutral3'} userSelect="none">
                {t('common.step.number', { number: index + 1 })}
              </Text>
              <Text variant="subheading2" color={step.active ? '$neutral1' : '$neutral2'} userSelect="none">
                {step.label}
              </Text>
            </Flex>
          </Flex>
          {index !== steps.length - 1 && (
            <Flex
              width="$spacing2"
              height="$spacing32"
              backgroundColor="$surface3"
              ml={15}
              my="$spacing8"
              borderRadius="$roundedFull"
            />
          )}
        </Fragment>
      ))}
    </Flex>
  )
}

export function PoolProgressIndicatorHeader({
  steps,
}: {
  steps: { label: string; active: boolean; onPress?: () => void }[]
}) {
  const { t } = useTranslation()
  const { showBorder: showBottomBorder, elementRef } = useStickyHeaderBorder(INTERFACE_NAV_HEIGHT)
  assert(steps.length > 0, 'PoolProgressIndicatorHeader: steps must have at least one step')

  const currentStepIndex = steps.findIndex((step) => step.active)
  const currentStep = steps[currentStepIndex]
  const stepNumber = currentStepIndex + 1
  const totalSteps = steps.length

  if (currentStepIndex === -1) {
    return null
  }

  return (
    <Flex
      ref={elementRef}
      row
      width="100%"
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing12"
      p="$spacing16"
      backgroundColor="$surface1"
      borderBottomWidth="$spacing1"
      borderTopWidth="$spacing1"
      borderTopColor={showBottomBorder ? 'transparent' : '$surface3'}
      borderBottomColor={showBottomBorder ? '$surface3' : 'transparent'}
      $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT, zIndex: 10 }}
    >
      <Flex
        width="$spacing32"
        height="$spacing32"
        borderRadius="$roundedFull"
        backgroundColor="$neutral1"
        alignItems="center"
        justifyContent="center"
      >
        <Text variant="subheading2" color="$surface1">
          {stepNumber}
        </Text>
      </Flex>

      <Flex flex={1} gap="$spacing2" minWidth={0}>
        <Text variant="body3" color="$neutral2" numberOfLines={1}>
          {t('common.step.number.of', { current: stepNumber, total: totalSteps })}
        </Text>
        <Text variant="subheading2" color="$neutral1" numberOfLines={1}>
          {currentStep.label}
        </Text>
      </Flex>
    </Flex>
  )
}
