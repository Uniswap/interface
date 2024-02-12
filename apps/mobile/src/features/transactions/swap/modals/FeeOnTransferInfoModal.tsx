import React from 'react'
import { useTranslation } from 'react-i18next'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'src/components/text/LearnMoreLink'
import { ModalName } from 'src/features/telemetry/constants'
import { Icons, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'wallet/src/constants/urls'

export function FeeOnTransferInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <WarningModal
      backgroundIconColor={colors.DEP_magentaDark.val}
      caption={t(
        'Some tokens take a fee when they are bought or sold, which is set by the token issuer. Uniswap does not receive any share of these fees.'
      )}
      closeText={t('Close')}
      icon={
        <Icons.MoneyBillSend
          color="$magentaVibrant"
          // @ts-expect-error TODO(MOB-1571): this token is the only one that doesn't use same width/height, overriding type here as it will pass through and work
          height={iconSizes.icon20}
          width={iconSizes.icon24}
        />
      }
      modalName={ModalName.FOTInfo}
      title={t('Why is there an additional fee?')}
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.feeOnTransferHelp} />
    </WarningModal>
  )
}
