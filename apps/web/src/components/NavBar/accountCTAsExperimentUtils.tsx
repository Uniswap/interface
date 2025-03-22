import { Trans } from 'react-i18next'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName, useExperimentGroupNameWithLoading } from 'uniswap/src/features/gating/hooks'

export function useIsAccountCTAExperimentControl() {
  const { value: experimentGroupName, isLoading } = useExperimentGroupNameWithLoading(Experiments.AccountCTAs)
  return {
    isControl: experimentGroupName === AccountCTAsExperimentGroup.Control || experimentGroupName === null,
    isLoading,
  }
}

export function ConnectWalletButtonText(): JSX.Element {
  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  return isSignIn ? (
    <Trans i18nKey="nav.signIn.button" />
  ) : isLogIn ? (
    <Trans i18nKey="nav.logIn.button" />
  ) : (
    <Trans i18nKey="common.connectWallet.button" />
  )
}
