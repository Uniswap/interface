import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupNameWithLoading } from 'uniswap/src/features/gating/hooks'

export function useIsAccountCTAExperimentControl() {
  const { value: experimentGroupName, isLoading } = useExperimentGroupNameWithLoading(Experiments.AccountCTAs)
  return {
    isControl: experimentGroupName === AccountCTAsExperimentGroup.Control || experimentGroupName === null,
    isLoading,
  }
}
