import { useTranslation } from 'react-i18next'
import { UniswapXText, isWeb } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons'
import { colors, opacify } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'

export function UniswapXInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={opacify(16, colors.uniswapXPurple)}
      caption={t('uniswapx.description')}
      closeText={t('common.button.close')}
      icon={<UniswapX size="$icon.24" />}
      modalName={ModalName.UniswapXInfo}
      title={
        <UniswapXText variant={isWeb ? 'subheading2' : 'body1'}>{t('uniswapx.label')}</UniswapXText>
      }
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.uniswapXInfo} />
    </WarningModal>
  )
}
