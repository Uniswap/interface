import type { ReactNode } from 'react'
import { Flex, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function StepHeader({
  onBack,
  onClose,
  headerActions,
  hideBack,
}: {
  onBack: () => void
  onClose: () => void
  /**
   * Replaces the default close X on the right. Pass `null` to suppress the entire header
   * row (useful when the surrounding surface already exposes back/close affordances, e.g.
   * mobile renders these in the native nav header, the extension popup uses Chrome's
   * window chrome).
   */
  headerActions?: ReactNode | null
  /** Hide the left-side back arrow while keeping the right-side actions. */
  hideBack?: boolean
}): JSX.Element | null {
  if (headerActions === null) {
    return null
  }
  const right = headerActions ?? <ModalCloseIcon testId={TestID.StepHeaderClose} size="$icon.20" onClose={onClose} />
  return (
    <Flex row width="100%" justifyContent={hideBack ? 'flex-end' : 'space-between'} alignItems="center">
      {!hideBack && (
        <TouchableArea variant="unstyled" testID={TestID.StepHeaderBack} onPress={onBack}>
          <BackArrow size="$icon.20" color="$neutral2" />
        </TouchableArea>
      )}
      {right}
    </Flex>
  )
}
