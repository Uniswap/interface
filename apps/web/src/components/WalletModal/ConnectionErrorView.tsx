import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export default function ConnectionErrorView() {
  const { t } = useTranslation()
  const { connectWallet, isConnecting, variables, reset, error } = useConnectWallet()

  const isOpen = Boolean(error && !isConnecting)

  const retry = useEvent(() => {
    const lastWallet = variables?.wallet
    reset()

    if (lastWallet) {
      connectWallet({ wallet: lastWallet })
    }
  })

  return (
    <WarningModal
      isOpen={isOpen}
      onClose={reset}
      onAcknowledge={retry}
      modalName={ModalName.ConnectionError}
      title={t('common.errorConnecting.error')}
      caption={t('wallet.connectionFailed.message')}
      acknowledgeText={t('common.button.tryAgain')}
      rejectText={t('common.button.close')}
      severity={WarningSeverity.Low}
    />
  )
}
