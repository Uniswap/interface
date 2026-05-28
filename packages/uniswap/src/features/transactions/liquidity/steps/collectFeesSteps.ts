import { CollectFeesTransactionStep } from 'uniswap/src/features/transactions/liquidity/steps/collectFees'

export type CollectFeesSteps = CollectFeesTransactionStep

export type CollectFeesFlow = {
  collectFees: CollectFeesTransactionStep
}

export function orderCollectFeesSteps(flow: CollectFeesFlow): CollectFeesSteps[] {
  return [flow.collectFees]
}
