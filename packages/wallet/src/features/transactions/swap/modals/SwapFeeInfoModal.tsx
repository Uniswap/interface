import { useTranslation } from 'react-i18next'
import { Text, TouchableArea, useSporeColors } from 'ui/src'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

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
