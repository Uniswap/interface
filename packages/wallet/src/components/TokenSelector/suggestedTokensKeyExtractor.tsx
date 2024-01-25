import { TokenOption } from 'wallet/src/components/TokenSelector/types'

export function suggestedTokensKeyExtractor(suggestedTokens: TokenOption[]): string {
  return suggestedTokens.map((token) => token.currencyInfo.currencyId).join('-')
}
