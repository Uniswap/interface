import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { assert } from 'utilities/src/errors'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { useStickyHeaderBorder } from '~/hooks/useStickyHeaderBorder'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

interface PoolProgressStep {
  label: string
  /** Overrides the default "Step N" eyebrow line (e.g. quick launch's single-step flow). */
  caption?: string
  active: boolean
  onPress?: () => void
}

export const SIDEBAR_WIDTH = 360
// Gap (px) between the sticky app header and a sticky sidebar. Default breathing room; pass 0 to sit
// flush with the header so the sidebar aligns with a sticky sibling such as a table header.
export const SIDEBAR_STICKY_TOP_OFFSET = 25

export function PoolProgressIndicator({
  steps,
  stickyTopOffset = SIDEBAR_STICKY_TOP_OFFSET,
}: {
  steps: PoolProgressStep[]
  // See SIDEBAR_STICKY_TOP_OFFSET. Pass 0 to align with a sticky sibling such as a table header.
  stickyTopOffset?: number
}) {
  const { t } = useTranslation()
  // Stick below the full app header (nav + any top-level banners), matching the pools table header.
  // INTERFACE_NAV_HEIGHT alone ignores the banner and tucks the indicator underneath it.
  const headerHeight = useAppHeaderHeight()
  assert(steps.length > 0, 'PoolProgressIndicator: steps must have at least one step')

  return (
    <Flex
      width={SIDEBAR_WIDTH}
      alignSelf="flex-start"
      $platform-web={{ position: 'sticky', top: headerHeight + stickyTopOffset }}
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
                {step.caption ?? t('common.step.number', { number: index + 1 })}
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
  flush = false,
}: {
  steps: PoolProgressStep[]
  /** Drops the top/bottom hairline borders and horizontal padding so the header sits flush with the parent's padding (mweb launch-auction flow). */
  flush?: boolean
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
      py="$spacing16"
      px={flush ? '$none' : '$spacing16'}
      backgroundColor="$surface1"
      borderBottomWidth={flush ? 0 : '$spacing1'}
      borderTopWidth={flush ? 0 : '$spacing1'}
      borderTopColor={showBottomBorder ? 'transparent' : '$surface3'}
      borderBottomColor={showBottomBorder ? '$surface3' : 'transparent'}
      $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT, zIndex: zIndexes.header }}
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
          {currentStep.caption ?? t('common.step.number.of', { current: stepNumber, total: totalSteps })}
        </Text>
        <Text variant="subheading2" color="$neutral1" numberOfLines={1}>
          {currentStep.label}
        </Text>
      </Flex>
    </Flex>
  )
}
