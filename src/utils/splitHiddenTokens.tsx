import { TokenBalance, TokenStandard } from 'graphql/data/__generated__/types-and-hooks'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

export function splitHiddenTokens(
  tokenBalances: TokenBalance[],
  options: {
    hideSmallBalances?: boolean
  } = { hideSmallBalances: true }
) {
  const visibleTokens: TokenBalance[] = []
  const hiddenTokens: TokenBalance[] = []

  for (const tokenBalance of tokenBalances) {
    // if undefined we keep visible (see https://linear.app/uniswap/issue/WEB-1940/[mp]-update-how-we-handle-what-goes-in-hidden-token-section-of-mini)
    const isUndefinedValue = typeof tokenBalance.denominatedValue?.value === 'undefined'
    const shouldHideSmallBalance =
      options?.hideSmallBalances &&
      !meetsThreshold(tokenBalance) && // if below $1
      tokenBalance.token?.standard !== TokenStandard.Native // do not hide native tokens regardless of small balance
    const isSpamToken = tokenBalance.tokenProjectMarket?.tokenProject?.isSpam
    if ((isUndefinedValue || !shouldHideSmallBalance) && !isSpamToken) {
      visibleTokens.push(tokenBalance)
    } else {
      hiddenTokens.push(tokenBalance)
    }
  }

  return { visibleTokens, hiddenTokens }
}

function meetsThreshold(tokenBalance: TokenBalance) {
  const value = tokenBalance.denominatedValue?.value ?? 0
  return value > HIDE_SMALL_USD_BALANCES_THRESHOLD
}
