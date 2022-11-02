import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'

import { unwrappedToken } from 'utils/wrappedCurrency'

import { useProAmmTotalFeeOwedByPosition } from './useProAmmPreviousTicks'

export function useProAmmPositionFees(tokenId?: BigNumber, position?: Position, asWETH = false) {
  const tokenIdHexString = tokenId?.toHexString()
  const { current, last24h } = useProAmmTotalFeeOwedByPosition(position?.pool, tokenIdHexString)
  if (position && current.length === 2) {
    return {
      current: [
        CurrencyAmount.fromRawAmount(
          !asWETH ? unwrappedToken(position?.pool.token0) : position?.pool.token0,
          current[0],
        ),
        CurrencyAmount.fromRawAmount(
          !asWETH ? unwrappedToken(position?.pool.token1) : position?.pool.token1,
          current[1],
        ),
      ],

      last24h: [
        CurrencyAmount.fromRawAmount(
          !asWETH ? unwrappedToken(position?.pool.token0) : position?.pool.token0,
          last24h[0],
        ),
        CurrencyAmount.fromRawAmount(
          !asWETH ? unwrappedToken(position?.pool.token1) : position?.pool.token1,
          last24h[1],
        ),
      ],
    }
  } else return { current: [undefined, undefined], last24h: [undefined, undefined] }
}
