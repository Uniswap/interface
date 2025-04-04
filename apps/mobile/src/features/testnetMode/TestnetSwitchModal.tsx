import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Wrench } from 'ui/src/components/icons'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function TestnetSwitchModal(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const modalState = useSelector(selectModalState(ModalName.TestnetSwitchModal))

  const { switchToMode } = modalState.initialState ?? {}

  const onToggleTestnetMode = (): void => {
    dispatch(closeModal({ name: ModalName.TestnetSwitchModal }))
    dispatch(setIsTestnetModeEnabled(switchToMode === 'testnet'))

    sendAnalyticsEvent(WalletEventName.TestnetModeToggled, {
      enabled: switchToMode === 'testnet',
      location: 'deep_link_modal',
    })
  }

  const onReject = (): void => {
    dispatch(closeModal({ name: ModalName.Swap }))
    dispatch(closeModal({ name: ModalName.TestnetSwitchModal }))
  }

  const toTestnetModeDescription = t('testnet.modal.swapDeepLink.description.toTestnetMode')
  const toProdModeDescription = t('testnet.modal.swapDeepLink.description.toProdMode')

  const toTestnetModeTitle = t('testnet.modal.swapDeepLink.title.toTestnetMode')
  const toProdModeTitle = t('testnet.modal.swapDeepLink.title.toProdMode')

  return (
    <WarningModal
      isOpen
      caption={switchToMode === 'production' ? toProdModeDescription : toTestnetModeDescription}
      rejectText={t('common.button.cancel')}
      acknowledgeText={t('common.button.confirm')}
      icon={<Wrench color="$neutral1" size="$icon.24" />}
      // only show if swap form state is provided
      modalName={ModalName.TestnetSwitchModal}
      severity={WarningSeverity.None}
      title={switchToMode === 'production' ? toProdModeTitle : toTestnetModeTitle}
      onAcknowledge={onToggleTestnetMode}
      onClose={onReject}
      onReject={onReject}
    />
  )
}
