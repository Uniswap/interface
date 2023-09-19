import React from 'react'
import { useTranslation } from 'react-i18next'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'
import { Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'wallet/src/constants/urls'

export function FeeOnTransferInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const onPressFOTLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.feeOnTransferHelp)
  }

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
          height={iconSizes.icon20}
          width={iconSizes.icon24}
        />
      }
      modalName={ModalName.FOTInfo}
      title={t('Why is there an additional fee?')}
      onClose={onClose}>
      <TouchableArea onPress={onPressFOTLearnMore}>
        <Text color="$magentaVibrant" variant="bodyLarge">
          {t('Learn more')}
        </Text>
      </TouchableArea>
    </WarningModal>
  )
}
