import { useTranslation } from 'react-i18next'
import { Icons, useSporeColors } from 'ui/src'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export function NetworkFeeInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.surface2.get()}
      caption={t(
        'This is the cost to process your transaction on the blockchain. Uniswap does not receive any share of these fees.'
      )}
      closeText={t('Close')}
      icon={<Icons.Gas color="$neutral2" size="$icon.24" />}
      modalName={ModalName.NetworkFeeInfo}
      severity={WarningSeverity.None}
      title={t('Network cost')}
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
    </WarningModal>
  )
}
