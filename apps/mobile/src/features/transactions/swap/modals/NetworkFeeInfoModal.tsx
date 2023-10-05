import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'src/components/text/LearnMoreLink'
import { ModalName } from 'src/features/telemetry/constants'
import { Icons, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'wallet/src/constants/urls'

export function NetworkFeeInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.surface2.get()}
      caption={t(
        'Network fees are paid to validators to process transactions, not to Uniswap Labs. These fees are required for all transactions on a blockchain.'
      )}
      closeText={t('Close')}
      icon={
        <Icons.Coin
          color={colors.neutral2.get()}
          height={iconSizes.icon24}
          width={iconSizes.icon24}
        />
      }
      modalName={ModalName.NetworkFeeInfo}
      severity={WarningSeverity.None}
      title={t('Network Fees')}
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
    </WarningModal>
  )
}
