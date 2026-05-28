import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Stable per-chain row suffix (multiple balances can share the same chainId).
 * Shared by web Portfolio hidden-token flattening and extension multichain materialization.
 */
export function multichainChainTokenRowSuffix(chainToken: { chainId: number; currencyInfo: CurrencyInfo }): string {
  return (
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    currencyId(chainToken.currencyInfo.currency) ??
    `${chainToken.chainId}-${currencyAddress(chainToken.currencyInfo.currency)}`
  )
}

export type ForEachFlattenedMultichainMultiChainItem<TChain extends { chainId: number; currencyInfo: CurrencyInfo }> = {
  token: TChain
  flattenedRowId: string
  rowSuffix: string
}

export type FlattenedMultichainChainTokenParams<TChain extends { chainId: number; currencyInfo: CurrencyInfo }> = {
  parentId: string
  chainTokens: readonly TChain[]
  onEmpty?: () => void
  onSingleChain: (token: TChain) => void
  onMultiChainEach: (item: ForEachFlattenedMultichainMultiChainItem<TChain>) => void
}

/**
 * Drives “one UI row per chain” flattening: empty parents are skipped, single-chain parents
 * stay one row with the same {@link FlattenedMultichainChainTokenParams.parentId}, multichain parents invoke
 * {@link FlattenedMultichainChainTokenParams.onMultiChainEach} once per chain with a synthetic
 * `${parentId}-${rowSuffix}` id.
 */
export function flattenMultichainChainToken<TChain extends { chainId: number; currencyInfo: CurrencyInfo }>(
  params: FlattenedMultichainChainTokenParams<TChain>,
): void {
  const { parentId, chainTokens, onEmpty, onSingleChain, onMultiChainEach } = params
  if (chainTokens.length === 0) {
    onEmpty?.()
    return
  }
  if (chainTokens.length === 1) {
    const only = chainTokens[0]
    if (only) {
      onSingleChain(only)
    }
    return
  }
  for (const token of chainTokens) {
    const rowSuffix = multichainChainTokenRowSuffix(token)
    onMultiChainEach({
      token,
      flattenedRowId: `${parentId}-${rowSuffix}`,
      rowSuffix,
    })
  }
}
