import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'

export function SwapProtectionInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.DEP_accentSuccessSoft.val}
      caption={t('swap.settings.protection.description')}
      closeText={t('common.button.close')}
      icon={<ShieldCheck color="$statusSuccess" size="$icon.24" />}
      isOpen={isOpen}
      modalName={ModalName.SwapProtection}
      title={t('swap.settings.protection.title')}
      onClose={onClose}
    >
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapProtection} />
    </WarningModal>
  )
}
