import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function NewUserCTAButton() {
  const { t } = useTranslation()

  const { openModal } = useModalState(ModalName.GetTheApp)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <Button
      fill={false}
      size="small"
      emphasis={isEmbeddedWalletEnabled ? 'primary' : 'tertiary'}
      variant={isEmbeddedWalletEnabled ? 'branded' : 'default'}
      onPress={openModal}
    >
      {isEmbeddedWalletEnabled ? t('nav.signUp.button') : t('common.getTheApp')}
    </Button>
  )
}
