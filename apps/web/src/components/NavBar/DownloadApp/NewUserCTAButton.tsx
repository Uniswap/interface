import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function NewUserCTAButton() {
  const { t } = useTranslation()

  const { openModal } = useModalState(ModalName.GetTheApp)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <Trace logPress element={isEmbeddedWalletEnabled ? ElementName.SignIn : ElementName.GetTheApp}>
      <Button
        testID={TestID.NewUserCTAButton}
        fill={false}
        size="small"
        emphasis={isEmbeddedWalletEnabled ? 'secondary' : 'tertiary'}
        variant={isEmbeddedWalletEnabled ? 'branded' : 'default'}
        onPress={openModal}
      >
        {isEmbeddedWalletEnabled ? t('nav.signUp.button') : t('common.getTheApp')}
      </Button>
    </Trace>
  )
}
