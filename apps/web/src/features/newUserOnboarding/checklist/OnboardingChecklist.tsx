import { Flex, type FlexCompatProps, useMedia, WebBottomSheet, zIndexes } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { Portal } from '@universe/mycelium/portal'
import { useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { spacing } from '@universe/mycelium/tokens'
import { TestID } from '@universe/test'
import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import {
  OnboardingChecklistBody,
  OnboardingChecklistHeader,
} from '~/features/newUserOnboarding/checklist/OnboardingChecklistContent'
import {
  type OnboardingChecklistController,
  useOnboardingChecklist,
} from '~/features/newUserOnboarding/checklist/useOnboardingChecklist'
import { MWEB_BOTTOM_INSET } from '~/utils/mwebBottomInset'

const CARD_WIDTH = 280
// Clears the in-app-browser chrome band on Android, as MobileBottomBar does
const CARD_BOTTOM = `calc(${spacing.spacing16}px + ${MWEB_BOTTOM_INSET})` as const

export function OnboardingChecklist(): JSX.Element | null {
  const media = useMedia()
  const checklist = useOnboardingChecklist({ isMobile: media.sm })
  if (!checklist.isVisible) {
    return null
  }

  return (
    <Portal zIndex={zIndexes.fixed}>
      {media.sm ? (
        <MobileOnboardingChecklist checklist={checklist} />
      ) : (
        <DesktopOnboardingChecklist checklist={checklist} />
      )}
    </Portal>
  )
}

function ChecklistCard({ children, ...props }: PropsWithChildren<FlexCompatProps>): JSX.Element {
  const shadowProps = useShadowPropsMedium()

  return (
    <Flex
      position="fixed"
      pointerEvents="auto"
      bottom={CARD_BOTTOM}
      p="$spacing8"
      backgroundColor="$surface1"
      borderWidth="$spacing1"
      borderColor="$surface3"
      testID={TestID.OnboardingChecklist}
      {...shadowProps}
      {...props}
    >
      {children}
    </Flex>
  )
}

function DesktopOnboardingChecklist({ checklist }: { checklist: OnboardingChecklistController }): JSX.Element {
  return (
    <ChecklistCard right="$spacing16" width={CARD_WIDTH} borderRadius="$rounded16">
      <OnboardingChecklistHeader checklist={checklist} size="small" />
      <HeightAnimator useInitialHeight open={checklist.isExpanded}>
        <Flex gap="$spacing12" pt="$spacing12">
          <OnboardingChecklistBody checklist={checklist} size="small" />
        </Flex>
      </HeightAnimator>
    </ChecklistCard>
  )
}

function MobileOnboardingChecklist({ checklist }: { checklist: OnboardingChecklistController }): JSX.Element {
  const { t } = useTranslation()

  return (
    <>
      <ChecklistCard left="$spacing16" right="$spacing16" borderRadius="$rounded20">
        <OnboardingChecklistHeader checklist={checklist} size="large" />
      </ChecklistCard>
      <WebBottomSheet
        isOpen={checklist.isExpanded}
        title={t('onboarding.checklist.title')}
        onClose={checklist.toggleExpanded}
        px="$spacing24"
        pb="$spacing24"
      >
        <Flex gap="$spacing12">
          <OnboardingChecklistHeader checklist={checklist} size="large" showToggle={false} />
          <OnboardingChecklistBody checklist={checklist} size="large" />
        </Flex>
      </WebBottomSheet>
    </>
  )
}
