import type { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { buildCurrencyId, currencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

export function getVaultShareCurrencyIds(vaults: readonly EarnVaultInfo[]): Set<string> {
  return new Set(
    vaults.map((vault) => normalizeCurrencyIdForMapLookup(buildCurrencyId(vault.chainId, vault.vaultAddress))),
  )
}

function filterVaultShareTokens({
  balance,
  vaultShareCurrencyIds,
}: {
  balance: PortfolioMultichainBalance
  vaultShareCurrencyIds: Set<string>
}): PortfolioMultichainBalance {
  if (vaultShareCurrencyIds.size === 0) {
    return balance
  }

  const tokens = balance.tokens.filter((token) => {
    const tokenCurrencyId = normalizeCurrencyIdForMapLookup(currencyId(token.currencyInfo.currency))
    return !vaultShareCurrencyIds.has(tokenCurrencyId)
  })

  return tokens.length === balance.tokens.length ? balance : { ...balance, tokens }
}

/** Drops vault share tokens, which the Earn surfaces show instead, and any balance left with no tokens. */
export function withoutVaultShareTokens({
  balances,
  vaultShareCurrencyIds,
}: {
  balances: PortfolioMultichainBalance[]
  vaultShareCurrencyIds: Set<string>
}): PortfolioMultichainBalance[] {
  return balances
    .map((balance) => filterVaultShareTokens({ balance, vaultShareCurrencyIds }))
    .filter((balance) => balance.tokens.length > 0)
}
