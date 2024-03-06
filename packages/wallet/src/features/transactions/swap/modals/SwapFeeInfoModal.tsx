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
          ? t('swap.warning.uniswapFee.message.default')
          : t('swap.warning.uniswapFee.message.included')
      }
      closeText={t('common.button.close')}
      modalName={ModalName.NetworkFeeInfo}
      severity={WarningSeverity.None}
      title={t('swap.warning.uniswapFee.title')}
      onClose={onClose}>
      <TouchableArea onPress={onPressLearnMore}>
        <Text color="$magentaVibrant" variant="buttonLabel3">
          {t('common.button.learn')}
        </Text>
      </TouchableArea>
    </WarningModal>
  )
}
