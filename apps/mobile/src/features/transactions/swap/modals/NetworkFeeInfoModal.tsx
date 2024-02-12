import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'src/components/text/LearnMoreLink'
import { ModalName } from 'src/features/telemetry/constants'
import { Icons, useSporeColors } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'

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
