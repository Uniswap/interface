import { useTranslation } from 'react-i18next'
import { Icons, useSporeColors } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { ModalName } from 'wallet/src/telemetry/constants'

export function SwapProtectionInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.DEP_accentSuccessSoft.val}
      caption={t('swap.settings.protection.description')}
      closeText={t('common.button.close')}
      icon={<Icons.ShieldCheck color="$statusSuccess" size="$icon.24" />}
      modalName={ModalName.SwapProtection}
      title={t('swap.settings.protection.title')}
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapProtection} />
    </WarningModal>
  )
}
