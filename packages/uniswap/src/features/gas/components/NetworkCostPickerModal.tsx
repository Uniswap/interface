import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkCostPicker } from 'uniswap/src/features/gas/components/NetworkCostPicker'
import {
  useEnableCustomGasFeeEntry,
  useSetEnableCustomGasFeeEntry,
} from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export interface NetworkCostPickerModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Platform-adaptive modal shell that hosts the `NetworkCostPicker` for the
 * wallet-level `userSettings.enableCustomGasFeeEntry` preference. Tapping a
 * row updates the stored value and closes the modal.
 *
 * - Mobile: bottom sheet
 * - Web/extension: centered modal
 */
export function NetworkCostPickerModal({ isOpen, onClose }: NetworkCostPickerModalProps): JSX.Element {
  const { t } = useTranslation()
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()
  const setEnableCustomGasFeeEntry = useSetEnableCustomGasFeeEntry()

  const handleChange = useEvent((enabled: boolean) => {
    setEnableCustomGasFeeEntry(enabled)
    onClose()
  })

  return (
    <Modal alignment="center" isModalOpen={isOpen} maxWidth={420} name={ModalName.NetworkCostPicker} onClose={onClose}>
      <Flex gap="$spacing4" pt="$spacing12">
        <Text textAlign="center" color="$neutral1" variant="subheading2">
          {t('gas.override.title')}
        </Text>
        <NetworkCostPicker enableCustomGasFeeEntry={enableCustomGasFeeEntry} onChange={handleChange} />
      </Flex>
    </Modal>
  )
}
