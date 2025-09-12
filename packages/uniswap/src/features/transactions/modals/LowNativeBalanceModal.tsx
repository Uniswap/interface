import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Checkbox, Flex, Text, TouchableArea } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { setHasDismissedLowNetworkTokenWarning } from 'uniswap/src/features/behaviorHistory/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface LowNativeBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  onAcknowledge: () => void
}

export function LowNativeBalanceModal({ isOpen, onClose, onAcknowledge }: LowNativeBalanceModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [doNotShowAgainSelected, setDoNotShowAgainSelected] = useState(false)

  const toggleDoNotShowAgain = useCallback(() => {
    setDoNotShowAgainSelected(!doNotShowAgainSelected)
  }, [doNotShowAgainSelected])

  const handleOnAcknowledge = useCallback(() => {
    if (doNotShowAgainSelected) {
      dispatch(setHasDismissedLowNetworkTokenWarning(true))
    }

    onAcknowledge()
  }, [dispatch, doNotShowAgainSelected, onAcknowledge])

  return (
    <WarningModal
      caption={t('transaction.warning.maxNative.message')}
      acknowledgeText={t('common.button.continue')}
      isOpen={isOpen}
      modalName={ModalName.LowNativeBalanceWarning}
      severity={WarningSeverity.Low}
      title={t('transaction.warning.maxNative.title')}
      rejectText={t('common.button.back')}
      onAcknowledge={handleOnAcknowledge}
      onClose={onClose}
      onReject={onClose}
    >
      <TouchableArea>
        <Flex row alignItems="center" gap="$spacing4">
          <Checkbox
            size="$icon.20"
            borderColor="$neutral2"
            checked={doNotShowAgainSelected}
            onPress={toggleDoNotShowAgain}
          />
          <Text variant="body3" color="$neutral2" py="$spacing8" onPress={toggleDoNotShowAgain}>
            {t('common.dontShowAgain')}
          </Text>
        </Flex>
      </TouchableArea>
    </WarningModal>
  )
}
