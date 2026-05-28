import { useTranslation } from 'react-i18next'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface Props {
  isVisible: boolean
  onBack: () => void
  onClose: () => void
  onAccept: () => void
  rampDirection: RampDirection
}

/**
 * Warning when selecting unsupported tokens for on/offramp.
 */
export default function UnsupportedTokenModal({
  isVisible,
  onBack,
  onClose,
  onAccept,
  rampDirection,
}: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <Dialog
      isOpen={isVisible}
      icon={<WarningIcon color="$statusWarning" size="$icon.24" />}
      iconBackgroundColor="$statusWarning2"
      title={t('fiatOffRamp.unsupportedToken.title')}
      subtext={
        rampDirection === RampDirection.ON_RAMP
          ? t('fiatOffRamp.unsupportedToken.buy.message')
          : t('fiatOffRamp.unsupportedToken.sell.message')
      }
      secondaryButton={{ text: t('fiatOffRamp.unsupportedToken.back'), onPress: onBack }}
      primaryButton={{ text: t('fiatOffRamp.unsupportedToken.swap'), onPress: onAccept }}
      modalName={ModalName.FiatOffRampUnsupportedTokenModal}
      buttonContainerProps={{ flexDirection: 'column' }}
      onClose={onClose}
    />
  )
}
