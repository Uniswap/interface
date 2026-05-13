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
   * Replaces the default close X on the right. Pass `null` to render nothing on the
   * right (useful when the surrounding surface already exposes a close affordance, e.g.
   * the extension popup uses Chrome's window chrome).
   */
  headerActions?: ReactNode | null
}): JSX.Element {
  const right =
    headerActions === undefined ? (
      <TouchableArea variant="unstyled" testID={TestID.StepHeaderClose} onPress={onClose}>
        <X size="$icon.20" color="$neutral2" />
      </TouchableArea>
    ) : (
      headerActions
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
