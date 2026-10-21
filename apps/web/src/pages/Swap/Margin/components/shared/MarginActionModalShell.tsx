import { Flex, ScrollView, type SpaceTokens } from '@universe/mycelium'
import type { TestIDType } from '@universe/test'
import type { ReactNode } from 'react'
import { Button } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { MarginModalHeader } from '~/pages/Swap/Margin/components/shared/MarginModalHeader'

// Chrome shared by every margin action modal: 420px sheet, header, scrolling body, pinned footer
// (status slot + full-width CTA). Body content, the footer's own ladder, and all CTA gating stay
// with the caller. The error slot is deliberately NOT a prop — the modals place it differently
// (inline-and-dimmed / replaces the outcome block / replaces the whole body).
export function MarginActionModalShell({
  modalName,
  title,
  isOpen,
  onClose,
  bodyGap = '$spacing16',
  footerMessage,
  ctaLabel,
  ctaDisabled,
  ctaLoading,
  ctaTestID,
  onConfirm,
  overlay,
  children,
}: {
  modalName: ModalNameType
  title: string
  isOpen: boolean
  onClose: () => void
  // maxWidth={420} maxHeight="90vh" padding={0} are non-overridable constants inside the shell —
  // all three existing modals pass exactly these, and pinning them is the point of the extraction.
  bodyGap?: SpaceTokens
  // A slot, not boolean props: MarginOpenReviewModal renders two status lines at once.
  footerMessage?: ReactNode
  ctaLabel: string
  ctaDisabled: boolean
  ctaLoading?: boolean
  ctaTestID?: TestIDType
  onConfirm: () => void
  // A nested Modal (the payment-token selector) — sibling of the body, still inside <Modal>.
  overlay?: ReactNode
  children: ReactNode
}): JSX.Element {
  return (
    <Modal name={modalName} isModalOpen={isOpen} maxWidth={420} maxHeight="90vh" padding={0} onClose={onClose}>
      <Flex>
        <Flex p="$spacing16" pb="$spacing12">
          <MarginModalHeader title={title} onClose={onClose} />
        </Flex>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Flex px="$spacing16" pb="$spacing16" gap={bodyGap}>
            {children}
          </Flex>
        </ScrollView>
        <Flex p="$spacing16" pt="$spacing12" gap="$spacing8">
          {footerMessage}
          <Flex row>
            <Button
              variant="branded"
              size="large"
              fill
              loading={ctaLoading}
              // Non-overridable: loading flips on every edit-debounce settle, and the default layout
              // animation arms a global `transition: all` on <body> (global.css) for its duration,
              // which animates unrelated color-token changes instead of snapping them.
              shouldAnimateBetweenLoadingStates={false}
              disabled={ctaDisabled}
              onPress={onConfirm}
              testID={ctaTestID}
            >
              {ctaLabel}
            </Button>
          </Flex>
        </Flex>
      </Flex>
      {overlay}
    </Modal>
  )
}
