import { useEffect, useReducer } from 'react'
import { getTokenReserves, getMarketDetails } from '@uniswap/sdk'
import { getMedian, getMean } from '../utils/math'

const DAI = 'DAI'
const USDC = 'USDC'
const TUSD = 'TUSD'

const USD_STABLECOINS = [DAI, USDC, TUSD]

const USD_STABLECOIN_ADDRESSES = [
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0x8dd5fbCe2F6a956C3022bA3663759011Dd51e73E'
]

const ETH_PRICE = 'ETH_PRICE'
const STABLECOIN_WEIGHTS = 'STABLECOIN_WEIGHTS'

const UPDATE_PRICE_AND_WEIGHTS = 'UPDATE_PRICE_AND_WEIGHTS'
const ERROR = 'ERROR'

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE_PRICE_AND_WEIGHTS: {
      const { [ETH_PRICE]: ethPrice, [STABLECOIN_WEIGHTS]: stablecoinWeights } = payload
      return {
        ...state,
        [ETH_PRICE]: ethPrice,
        [STABLECOIN_WEIGHTS]: stablecoinWeights
      }
    }
    case ERROR: {
      return {
        ...state,
        [ETH_PRICE]: null,
        [STABLECOIN_WEIGHTS]: null
      }
    }
    default: {
      throw Error(`Unexpected action type in useUSDPrice reducer: '${type}'.`)
    }
  }
}

function forEachStablecoin(runner) {
  return USD_STABLECOINS.map((stablecoin, index) => runner(index, stablecoin))
}

export function useUSDPrice(provider) {
  const [state, dispatch] = useReducer(reducer, {
    [ETH_PRICE]: undefined,
    [STABLECOIN_WEIGHTS]: undefined
  })

  useEffect(() => {
    if (provider) {
      let stale = false

      Promise.all(forEachStablecoin(i => getTokenReserves(USD_STABLECOIN_ADDRESSES[i], provider)))
        .then(reserves => {
          const ethReserves = forEachStablecoin(i => reserves[i].ethReserve.amount)

          const marketDetails = forEachStablecoin(i => getMarketDetails(reserves[i], undefined))
          const ethPrices = forEachStablecoin(i => marketDetails[i].marketRate.rateInverted)

          const [median, medianWeights] = getMedian(ethPrices)
          const [mean, meanWeights] = getMean(ethPrices)
          const [weightedMean, weightedMeanWeights] = getMean(ethPrices, ethReserves)

          const ethPrice = getMean([median, mean, weightedMean])[0]
          const _stablecoinWeights = [
            getMean([medianWeights[0], meanWeights[0], weightedMeanWeights[0]])[0],
            getMean([medianWeights[1], meanWeights[1], weightedMeanWeights[1]])[0],
            getMean([medianWeights[2], meanWeights[2], weightedMeanWeights[2]])[0]
          ]
          const stablecoinWeights = forEachStablecoin((i, stablecoin) => ({
            [stablecoin]: _stablecoinWeights[i]
          })).reduce((accumulator, currentValue) => ({ ...accumulator, ...currentValue }), {})

          if (!stale) {
            dispatch({
              type: UPDATE_PRICE_AND_WEIGHTS,
              payload: { [ETH_PRICE]: ethPrice, [STABLECOIN_WEIGHTS]: stablecoinWeights }
            })
          }
        })
        .catch(error => {
          console.error('Error in useUSDPrice: ', error)
          dispatch({ type: ERROR })
        })

      return () => {
        stale = true
      }
    }
  }, [provider])

  return [state[ETH_PRICE], state[STABLECOIN_WEIGHTS]]
}
