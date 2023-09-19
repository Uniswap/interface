import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'
import { Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'wallet/src/constants/urls'

export function NetworkFeeInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.networkFeeInfo)
  }

  return (
    <WarningModal
      backgroundIconColor={colors.surface2.val}
      caption={t(
        'Network fees are paid to validators to process transactions, not to Uniswap Labs. These fees are required for all transactions on a blockchain.'
      )}
      closeText={t('Close')}
      icon={
        <Icons.Coin
          color={colors.neutral2.val}
          height={iconSizes.icon24}
          width={iconSizes.icon24}
        />
      }
      modalName={ModalName.NetworkFeeInfo}
      severity={WarningSeverity.None}
      title={t('Network Fees')}
      onClose={onClose}>
      <TouchableArea onPress={onPressLearnMore}>
        <Text color="$magentaVibrant" variant="bodyLarge">
          {t('Learn more')}
        </Text>
      </TouchableArea>
    </WarningModal>
  )
}
