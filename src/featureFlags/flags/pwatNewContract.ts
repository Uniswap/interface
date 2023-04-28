import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function usePwatNewContractFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.newContractForPWAT)
}

export function usePwatNewContractEnabled(): boolean {
  return usePwatNewContractFlag() === BaseVariant.Enabled
}

export { BaseVariant as PwatNewContractVariant }
