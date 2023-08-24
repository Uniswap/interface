import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'
import { Icons, Text } from 'ui/src'
import { SWAP_PROTECTION_HELP_URL } from 'wallet/src/constants/urls'

export function SwapProtectionInfoModal({ onClose }: { onClose: () => void }): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const onPressLearnMoreSwapModal = async (): Promise<void> => {
    await openUri(SWAP_PROTECTION_HELP_URL)
  }

  return (
    <WarningModal
      backgroundIconColor={theme.colors.DEP_accentSuccessSoft}
      caption={t(
        'With swap protection on, your Ethereum transactions will be protected from sandwich attacks, with reduced chances of failure.'
      )}
      closeText={t('Close')}
      icon={
        <Icons.ShieldCheck
          color={theme.colors.statusSuccess}
          height={theme.iconSizes.icon24}
          width={theme.iconSizes.icon24}
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
