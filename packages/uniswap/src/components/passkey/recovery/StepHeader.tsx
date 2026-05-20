import type { ReactNode } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { X } from 'ui/src/components/icons/X'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function StepHeader({
  onBack,
  onClose,
  headerActions,
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
}): JSX.Element | null {
  if (headerActions === null) {
    return null
  }
  const right = headerActions ?? (
    <TouchableArea variant="unstyled" testID={TestID.StepHeaderClose} onPress={onClose}>
      <X size="$icon.20" color="$neutral2" />
    </TouchableArea>
  )
  return (
    <Flex row width="100%" justifyContent="space-between" alignItems="center">
      <TouchableArea variant="unstyled" testID={TestID.StepHeaderBack} onPress={onBack}>
        <BackArrow size="$icon.20" color="$neutral2" />
      </TouchableArea>
      {right}
    </Flex>
  )
}
