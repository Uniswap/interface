import React from 'react'
import { useTranslation } from 'react-i18next'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'src/components/text/LearnMoreLink'
import { ModalName } from 'src/features/telemetry/constants'
import { Icons, useSporeColors } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'

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
