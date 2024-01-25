import { useTranslation } from 'react-i18next'
import { Icons, useSporeColors } from 'ui/src'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { ModalName } from 'wallet/src/telemetry/constants'

export function SwapProtectionInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.DEP_accentSuccessSoft.val}
      caption={t(
        'With swap protection on, your Ethereum transactions will be protected from sandwich attacks, with reduced chances of failure.'
      )}
      closeText={t('Close')}
      icon={<Icons.ShieldCheck color="$statusSuccess" size="$icon.24" />}
      modalName={ModalName.SwapProtection}
      title={t('Swap Protection')}
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapProtection} />
    </WarningModal>
  )
}
