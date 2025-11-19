import { useTranslation } from 'react-i18next'
import { MONAD_LOGO_FILLED, MONAD_TEST_BANNER_LIGHT } from 'ui/src/assets'
import {
  type ModalFeatureItem,
  ModalTemplate,
  type ModalTemplateButton,
} from 'uniswap/src/components/notifications/ModalTemplate'

interface MonadAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onExplorePress: () => void
}

/**
 * Static modal component for Monad announcement
 */
export function MonadAnnouncementModal({ isOpen, onClose, onExplorePress }: MonadAnnouncementModalProps): JSX.Element {
  const { t } = useTranslation()

  const features: ModalFeatureItem[] = [
    {
      text: t('notification.monad.feature.searchSwap'),
      iconUrl: 'custom:coin-convert-$neutral2',
    },
    {
      text: t('notification.monad.feature.compatibleWallets'),
      iconUrl: 'custom:ethereum-$neutral2',
    },
    {
      text: t('notification.monad.feature.zeroGas'),
      iconUrl: 'custom:gas-$neutral2',
    },
  ]

  const buttons: ModalTemplateButton[] = [
    {
      text: t('notification.monad.button.explore'),
      onPress: onExplorePress,
      isPrimary: true,
    },
  ]

  return (
    <ModalTemplate
      isOpen={isOpen}
      name="monad-announcement"
      backgroundImageUrl={MONAD_TEST_BANNER_LIGHT}
      iconUrl={MONAD_LOGO_FILLED}
      title={t('notification.monad.title')}
      subtitle={t('notification.monad.subtitle')}
      features={features}
      buttons={buttons}
      onClose={onClose}
    />
  )
}
