import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'
import { Text, TouchableArea, useSporeColors } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'

export function SwapFeeInfoModal({
  onClose,
  noFee,
}: {
  onClose: () => void
  noFee: boolean
}): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.swapFeeInfo)
  }

  return (
    <WarningModal
      hideIcon
      backgroundIconColor={colors.surface2.get()}
      caption={
        noFee
          ? t(
              'Fees are applied on a few select tokens to ensure the best experience with Uniswap. There is no fee associated with this swap.'
            )
          : t(
              'Fees are applied on a few select tokens to ensure the best experience with Uniswap, and have already been factored into this quote.'
            )
      }
      closeText={t('Close')}
      modalName={ModalName.NetworkFeeInfo}
      severity={WarningSeverity.None}
      title={t('Swap fee')}
      onClose={onClose}>
      <TouchableArea onPress={onPressLearnMore}>
        <Text color="$magentaVibrant" variant="buttonLabel3">
          {t('Learn more')}
        </Text>
      </TouchableArea>
    </WarningModal>
  )
}
