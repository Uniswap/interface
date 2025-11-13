import { useTranslation } from 'react-i18next'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface Props {
  isVisible: boolean
  onBack: () => void
  onClose: () => void
  onAccept: () => void
}

/**
 * Warning when selecting unsupported tokens for offramp.
 */
export default function UnsupportedTokenModal({ isVisible, onBack, onClose, onAccept }: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <Dialog
      isOpen={isVisible}
      icon={<WarningIcon color="$statusWarning" size="$icon.24" />}
      iconBackgroundColor="$statusWarning2"
      title={t('fiatOffRamp.unsupportedToken.title')}
      subtext={t('fiatOffRamp.unsupportedToken.message')}
      secondaryButton={{ text: t('fiatOffRamp.unsupportedToken.back'), onPress: onBack }}
      primaryButton={{ text: t('fiatOffRamp.unsupportedToken.swap'), onPress: onAccept }}
      modalName={ModalName.FiatOffRampUnsupportedTokenModal}
      buttonContainerProps={{ flexDirection: 'column' }}
      onClose={onClose}
    />
  )
}
