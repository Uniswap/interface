import type { JupiterOrderUrlParams } from '@universe/api/src/clients/jupiter/types'

export function buildQuery(params: JupiterOrderUrlParams): URLSearchParams {
  const query = new URLSearchParams()

  query.set('inputMint', params.inputMint)

  query.set('outputMint', params.outputMint)

  query.set('amount', params.amount.toString())

  query.set('swapMode', params.swapMode)

  if (params.taker) {
    query.set('taker', params.taker)
  }
  if (params.referralAccount) {
    query.set('referralAccount', params.referralAccount)
  }
  if (params.referralFee) {
    query.set('referralFee', params.referralFee.toString())
  }
  if (params.slippageBps) {
    query.set('slippageBps', params.slippageBps.toString())
  }
  return query
}
