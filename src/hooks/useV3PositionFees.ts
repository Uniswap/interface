import { useSingleCallResult } from 'state/multicall/hooks'
import { useEffect, useState } from 'react'
import { useV3NFTPositionManagerContract } from './useContract'
import { BigNumber } from '@ethersproject/bignumber'
import { Pool } from '@uniswap/v3-sdk'
import { CurrencyAmount, Token, currencyEquals, ETHER, Ether } from '@uniswap/sdk-core'
import { useBlockNumber } from 'state/application/hooks'
import { unwrappedToken } from 'utils/wrappedCurrency'

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  asWETH = false
): [CurrencyAmount<Token | Ether>, CurrencyAmount<Token | Ether>] | [undefined, undefined] {
  const positionManager = useV3NFTPositionManagerContract(false)
  const owner = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]

  const tokenIdHexString = tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()

  // TODO find a way to get this into multicall
  // because these amounts don't ever go down, we don't actually need to clear this state
  // latestBlockNumber is included to ensure data stays up-to-date every block
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber]>()
  useEffect(() => {
    if (positionManager && tokenIdHexString && owner && typeof latestBlockNumber === 'number') {
      positionManager.callStatic
        .collect(
          {
            tokenId: tokenIdHexString,
            recipient: owner, // some tokens might fail if transferred to address(0)
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
          { from: owner } // need to simulate the call as the owner
        )
        .then((results) => {
          setAmounts([results.amount0, results.amount1])
        })
    }
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber])

  if (pool && amounts) {
    return [
      !asWETH && currencyEquals(unwrappedToken(pool.token0), ETHER)
        ? CurrencyAmount.ether(amounts[0].toString())
        : CurrencyAmount.fromRawAmount(pool.token0, amounts[0].toString()),
      !asWETH && currencyEquals(unwrappedToken(pool.token1), ETHER)
        ? CurrencyAmount.ether(amounts[1].toString())
        : CurrencyAmount.fromRawAmount(pool.token1, amounts[1].toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}
