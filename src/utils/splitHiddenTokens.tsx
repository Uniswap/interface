import { TokenBalance, TokenStandard } from 'graphql/data/__generated__/types-and-hooks'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

interface SplitOptions {
  hideSmallBalances?: boolean
  hideSpam?: boolean
}

export function splitHiddenTokens(
  tokenBalances: TokenBalance[],
  { hideSmallBalances = true, hideSpam = true }: SplitOptions = {}
) {
  const visibleTokens: TokenBalance[] = []
  const hiddenTokens: TokenBalance[] = []

  for (const tokenBalance of tokenBalances) {
    const isSpam = tokenBalance.tokenProjectMarket?.tokenProject?.isSpam
    if ((hideSpam && isSpam) || (hideSmallBalances && isNegligibleBalance(tokenBalance))) {
      hiddenTokens.push(tokenBalance)
    } else {
      visibleTokens.push(tokenBalance)
    }
  }

  return { visibleTokens, hiddenTokens }
}

function isNegligibleBalance({ denominatedValue, token }: TokenBalance) {
  return (
    denominatedValue?.value !== undefined && // if undefined we keep visible (see WEB-1940)
    token?.standard !== TokenStandard.Native && // always show native token balances
    denominatedValue?.value < HIDE_SMALL_USD_BALANCES_THRESHOLD // hide balances less than $1
  )
}
