import { useState } from 'react'
import { DevSettings } from 'react-native'
import { MMKV } from 'react-native-mmkv'
import { Flex, type IconProps, Text, TouchableArea } from 'ui/src'
import { RotatableChevron, UniswapLogo } from 'ui/src/components/icons'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'

/**
 * Dev tool to simulate complete Redux data loss while keeping Keyring intact.
 * This helps test the on-device recovery flow.
 */
export function ForceReduxDataLossRow({ iconProps }: { iconProps: IconProps }): JSX.Element {
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const onConfirm = (): void => {
    setShowConfirmModal(false)
    // Clear the default MMKV instance which stores Redux persisted state
    const storage = new MMKV()
    storage.clearAll()
    logger.debug('ForceReduxDataLossRow', 'onConfirm', 'MMKV storage cleared, exiting app')

    try {
      DevSettings.reload('Dev menu: force redux data loss')
    } catch {
      // Fallback: crash the app to force restart if reload isn't available
      setTimeout(() => {
        throw new Error('Forcing app restart after Redux data loss simulation')
      }, 500)
    }
  }

  return (
    <>
      <WarningModal
        caption="This will delete all Redux persisted data in MMKV while keeping Keyring mnemonics intact. Use this to test the on-device recovery flow."
        acknowledgeText="Clear & Restart"
        rejectText="Cancel"
        isOpen={showConfirmModal}
        modalName={ModalName.DevResetOnboardingWarning}
        severity={WarningSeverity.High}
        title="Simulate Redux Data Loss?"
        onClose={() => setShowConfirmModal(false)}
        onReject={() => setShowConfirmModal(false)}
        onAcknowledge={onConfirm}
      />
      <TouchableArea onPress={() => setShowConfirmModal(true)}>
        <Flex row alignItems="center" justifyContent="space-between" py="$spacing4">
          <Flex row alignItems="center">
            <Flex centered height={32} width={32}>
              <UniswapLogo {...iconProps} />
            </Flex>
            <Text ml="$spacing12" variant="body1">
              Test recovery
            </Text>
          </Flex>
          <RotatableChevron color="$neutral3" direction="end" size="$icon.24" />
        </Flex>
      </TouchableArea>
    </>
  )
}
