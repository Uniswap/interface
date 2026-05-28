import { Currency } from '@uniswap/sdk-core'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'

/** Currency for the selected multichain deployment; falls back to `base` when there is no selection. */
export function currencyForSelectedMultichainDeployment(
  base: Currency,
  entry: MultichainTokenEntry | undefined,
): Currency {
  if (!entry) {
    return base
  }
  if (entry.isNative) {
    const { decimals, symbol, name } = getChainInfo(entry.chainId).nativeCurrency
    const nativeCurrency = buildCurrency({
      chainId: entry.chainId,
      decimals,
      symbol,
      name,
    })
    return nativeCurrency ?? base
  }
  const built = buildCurrency({
    chainId: entry.chainId,
    address: entry.address,
    decimals: base.decimals,
    symbol: base.symbol,
    name: base.name,
    bypassChecksum: true,
  })
  return built ?? base
}
