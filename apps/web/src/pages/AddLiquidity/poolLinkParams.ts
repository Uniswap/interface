import type { FeeData } from 'uniswap/src/features/positions/types'

export function buildPoolSearchParams(meta: {
  currencyA?: string
  currencyB?: string
  chain?: string
  fee?: FeeData
  hookAddress?: string
  protocolVersion?: string
}): URLSearchParams {
  const params = new URLSearchParams()
  if (meta.currencyA) {
    params.set('currencyA', meta.currencyA)
  }
  if (meta.currencyB) {
    params.set('currencyB', meta.currencyB)
  }
  if (meta.chain) {
    params.set('chain', meta.chain)
  }
  if (meta.fee) {
    params.set('fee', JSON.stringify(meta.fee))
  }
  if (meta.hookAddress) {
    params.set('hook', meta.hookAddress)
  }
  if (meta.protocolVersion) {
    params.set('protocolVersion', meta.protocolVersion)
  }
  return params
}
