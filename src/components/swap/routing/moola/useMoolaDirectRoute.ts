import { CeloContract } from '@celo/contractkit'
import { ChainId, currencyEquals, JSBI, Pair, Route, Token, TokenAmount } from '@ubeswap/sdk'
import { useActiveWeb3React } from 'hooks/index'
import { useMemo } from 'react'
import { useUserAllowMoolaWithdrawal } from 'state/user/hooks'
import { moolaLendingPools } from './useMoola'

const BIG_NUMBER = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(255))

export const useMoolaDirectRoute = (
  inputCurrency: Token | null | undefined,
  outputCurrency: Token | null | undefined
): Route | null => {
  const { library, chainId } = useActiveWeb3React()
  const [allowMoolaWithdrawal] = useUserAllowMoolaWithdrawal()

  return useMemo(() => {
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
    const { mcUSD, mCELO } = chainCfg

    const routes = [
      [chainCfg[CeloContract.StableToken], mcUSD],
      [chainCfg[CeloContract.GoldToken], mCELO],
      ...(allowMoolaWithdrawal
        ? [
            [mcUSD, chainCfg[CeloContract.StableToken]],
            [mCELO, chainCfg[CeloContract.GoldToken]],
          ]
        : []),
    ] as const

    const routeRaw =
      inputCurrency &&
      outputCurrency &&
      routes.find(([a, b]) => currencyEquals(inputCurrency, a) && currencyEquals(outputCurrency, b))
    if (!routeRaw) {
      return null
    }

    return new Route(
      [new Pair(new TokenAmount(inputCurrency, BIG_NUMBER), new TokenAmount(outputCurrency, BIG_NUMBER))],
      inputCurrency,
      outputCurrency
    )
  }, [inputCurrency, outputCurrency, allowMoolaWithdrawal, chainId, library])
}
