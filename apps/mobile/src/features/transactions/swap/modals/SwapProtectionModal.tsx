import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'
import { Icons, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'wallet/src/constants/urls'

export function SwapProtectionInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressLearnMoreSwapModal = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.swapProtection)
  }

  return (
    <WarningModal
      backgroundIconColor={colors.DEP_accentSuccessSoft.val}
      caption={t(
        'With swap protection on, your Ethereum transactions will be protected from sandwich attacks, with reduced chances of failure.'
      )}
      closeText={t('Close')}
      icon={
        <Icons.ShieldCheck
          color="$statusSuccess"
          height={iconSizes.icon24}
          width={iconSizes.icon24}
        />
      }
      modalName={ModalName.SwapProtection}
      title={t('Swap Protection')}
      onClose={onClose}>
      <TouchableArea onPress={onPressLearnMoreSwapModal}>
        <Text color="$magentaVibrant" variant="bodyLarge">
          {t('Learn more')}
        </Text>
      </TouchableArea>
    </WarningModal>
  )
}
