import { CeloContract } from '@celo/contractkit'
import { ChainId, currencyEquals, JSBI, Pair, Route, Token, TokenAmount } from '@ubeswap/sdk'
import { useActiveWeb3React } from 'hooks/index'
import { useUserAllowMoolaWithdrawal } from 'state/user/hooks'
import { moolaLendingPools } from './useMoola'

const BIG_NUMBER = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(255))

export const useMoolaRoute = (
  inputCurrency: Token | null | undefined,
  outputCurrency: Token | null | undefined
): Route | null => {
  const { library, chainId } = useActiveWeb3React()
  const [allowMoolaWithdrawal] = useUserAllowMoolaWithdrawal()

  if (chainId === ChainId.BAKLAVA) {
    return null
  }

  if (!library) {
    return null
  }

  if (!inputCurrency || !outputCurrency) {
    return null
  }

  const chainCfg = moolaLendingPools[chainId]

  const mcUSD = new Token(chainId, chainCfg.mcUSD, 18, 'mcUSD', 'Moola cUSD')
  const mCELO = new Token(chainId, chainCfg.mCELO, 18, 'mCELO', 'Moola CELO')

  const routes = [
    [chainCfg[CeloContract.StableToken], mcUSD],
    [chainCfg[CeloContract.GoldToken], mCELO],
    ...(allowMoolaWithdrawal
      ? [
          [mcUSD, chainCfg[CeloContract.StableToken]],
          [mCELO, chainCfg[CeloContract.StableToken]],
        ]
      : []),
  ] as const

  const route =
    inputCurrency &&
    outputCurrency &&
    routes.find(([a, b]) => currencyEquals(inputCurrency, a) && currencyEquals(outputCurrency, b))
  if (!route) {
    return null
  }

  return new Route(
    [new Pair(new TokenAmount(inputCurrency, BIG_NUMBER), new TokenAmount(outputCurrency, BIG_NUMBER))],
    inputCurrency,
    outputCurrency
  )
}
