import { Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupNameWithLoading } from 'uniswap/src/features/gating/hooks'

export enum AccountCTAsExperimentGroup {
  Control = 'Control', // Get the app / Connect
  SignInSignUp = 'SignIn-SignUp',
  LogInCreateAccount = 'LogIn-CreateAccount',
}

export function useIsAccountCTAExperimentControl() {
  const { value: experimentGroupName, isLoading } = useExperimentGroupNameWithLoading(Experiments.AccountCTAs)
  return {
    isControl: experimentGroupName === AccountCTAsExperimentGroup.Control || experimentGroupName === null,
    isLoading,
  }
}
