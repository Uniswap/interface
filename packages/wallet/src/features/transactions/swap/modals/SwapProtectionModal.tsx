import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons'
import { zIndexes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function SwapProtectionInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.statusSuccess2.val}
      caption={t('swap.settings.protection.description')}
      rejectText={t('common.button.close')}
      icon={<ShieldCheck color="$statusSuccess" size="$icon.24" />}
      isOpen={isOpen}
      modalName={ModalName.SwapProtection}
      title={t('swap.settings.protection.title')}
      zIndex={zIndexes.popover}
      onClose={onClose}
    >
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapProtection} />
    </WarningModal>
  )
}
