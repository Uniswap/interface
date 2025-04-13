import { useIsAccountCTAExperimentControl } from 'components/NavBar/accountCTAsExperimentUtils'
import { useTranslation } from 'react-i18next'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { Button } from 'ui/src'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function NewUserCTAButton() {
  const { t } = useTranslation()

  const openModal = useOpenModal({ name: ApplicationModal.GET_THE_APP })

  const { isControl: isSignInExperimentControl } = useIsAccountCTAExperimentControl()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isSignUp =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp ||
    isEmbeddedWalletEnabled
  const isCreateAccount =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount &&
    !isEmbeddedWalletEnabled

  return (
    <Button
      fill={false}
      size="small"
      emphasis={isSignInExperimentControl ? 'tertiary' : 'primary'}
      variant={isSignInExperimentControl ? 'default' : 'branded'}
      onPress={openModal}
    >
      {isSignUp ? t('nav.signUp.button') : isCreateAccount ? t('nav.createAccount.button') : t('common.getTheApp')}
    </Button>
  )
}
