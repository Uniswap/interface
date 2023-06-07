import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
} from 'wallet/src/features/wallet/selectors'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

export const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW'

/**
 * Checks if a token balance should be hidden.
 *
 * @param hideSpamTokens - Indicates whether to hide spam tokens.
 * @param hideSmallBalances - Indicates whether to hide tokens with small balances.
 * @param isSpam - The spam status of the token, which could be undefined.
 * @param balanceUSD - The balance of the token in USD, which could be undefined.
 *
 * @returns {boolean} - Returns true if the token balance should be hidden, false otherwise.
 *
 * @example
 * const isHidden = isTokenBalanceHidden({ hideSpamTokens, hideSmallBalances, isSpam, balanceUSD });
 */
function isTokenBalanceHidden({
  hideSpamTokens,
  hideSmallBalances,
  isSpam,
  balanceUSD,
}: {
  hideSpamTokens: boolean
  hideSmallBalances: boolean
  isSpam: Maybe<boolean>
  balanceUSD: Maybe<number>
}): boolean {
  const shouldHideSpam = hideSpamTokens && isSpam
  const isSmallBalance = !balanceUSD || balanceUSD < HIDE_SMALL_USD_BALANCES_THRESHOLD
  const shouldHideSmallBalance = hideSmallBalances && isSmallBalance
  return shouldHideSpam || shouldHideSmallBalance
}

function useGetTokenVisibility(owner: Address): {
  hideSpamTokens: boolean
  hideSmallBalances: boolean
} {
  const hideSmallBalances: boolean = useAppSelector(makeSelectAccountHideSmallBalances(owner))
  const hideSpamTokens: boolean = useAppSelector(makeSelectAccountHideSpamTokens(owner))
  return {
    hideSmallBalances,
    hideSpamTokens,
  }
}

/**
 * Custom hook to group Token Balances fetched from API to visible and hidden.
 *
 * @param balancesById - An object where keys are token ids and values are the corresponding balances. May be undefined.
 * @param expandHiddenTokens - Boolean flag to indicate if hidden tokens should be expanded.
 * @param owner - The owner address for which token balances are managed.
 *
 * @returns {object} An object containing two fields:
 *  - `tokens`: an array of tokens which could be a mix of PortfolioBalance instances or string (presumably token ids).
 *  - `numHidden`: the number of hidden tokens.
 *
 * @example
 * const { tokens, numHidden } = useGroupTokenBalancesByVisibility({ balancesById, expandHiddenTokens, owner });
 */
export function useTokenBalancesGroupedByVisibility({
  balancesById,
  expandHiddenTokens,
  owner,
}: {
  balancesById?: Record<string, PortfolioBalance>
  expandHiddenTokens: boolean
  owner: Address
}): {
  tokens: Array<PortfolioBalance | string>
  numHidden: number
} {
  const { hideSmallBalances, hideSpamTokens } = useGetTokenVisibility(owner)

  return useMemo(() => {
    if (!balancesById) {
      return { tokens: EMPTY_ARRAY, numHidden: 0 }
    }

    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        const isHidden = isTokenBalanceHidden({
          hideSpamTokens,
          hideSmallBalances,
          balanceUSD: balance.balanceUSD,
          isSpam: balance.currencyInfo.isSpam,
        })

        if (isHidden) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }
        return acc
      },
      { shown: [], hidden: [] }
    )
    return {
      tokens: [
        ...shown,
        ...(hidden.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
        ...(expandHiddenTokens ? hidden : []),
      ],
      numHidden: hidden.length,
    }
  }, [balancesById, expandHiddenTokens, hideSpamTokens, hideSmallBalances])
}
