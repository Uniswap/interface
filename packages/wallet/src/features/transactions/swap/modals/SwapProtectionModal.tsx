import { zIndexes } from '@universe/mycelium'
import { ShieldCheck } from '@universe/mycelium/icons/ShieldCheck'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
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
      <LearnMoreLink url={UniswapHelpUrls.articles.swapProtection} />
    </WarningModal>
  )
}
