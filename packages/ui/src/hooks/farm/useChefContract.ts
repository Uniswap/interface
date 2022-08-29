import { Chef } from 'constants/farm/chef.enum'
import { useMasterChefContract, useMasterChefV2Contract, useMiniChefContract } from 'hooks/useContract'
import { useMemo } from 'react'

export function useChefContract(chef: Chef) {
  const masterChefContract = useMasterChefContract()
  const masterChefV2Contract = useMasterChefV2Contract()
  const miniChefContract = useMiniChefContract()
  const contracts = useMemo(
    () => ({
      [Chef.MASTERCHEF]: masterChefContract,
      [Chef.MASTERCHEF_V2]: masterChefV2Contract,
      [Chef.MINICHEF]: miniChefContract
    }),
    [masterChefContract, masterChefV2Contract, miniChefContract]
  )
  return useMemo(() => {
    return contracts[chef]
  }, [contracts, chef])
}

export function useChefContracts(chefs: Chef[]) {
  const masterChefContract = useMasterChefContract()
  const masterChefV2Contract = useMasterChefV2Contract()
  const miniChefContract = useMiniChefContract()
  const contracts = useMemo(
    () => ({
      [Chef.MASTERCHEF]: masterChefContract,
      [Chef.MASTERCHEF_V2]: masterChefV2Contract,
      [Chef.MINICHEF]: miniChefContract
    }),
    [masterChefContract, masterChefV2Contract, miniChefContract]
  )
  return chefs.map(chef => contracts[chef])
}
