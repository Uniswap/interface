import { getMarketDetails } from '@uniswap/sdk'
import { getMedian, getMean } from './math'

const DAI = 'DAI'
const USDC = 'USDC'
const TUSD = 'TUSD'

const USD_STABLECOINS = [DAI, USDC, TUSD]

function forEachStablecoin(runner) {
  return USD_STABLECOINS.map((stablecoin, index) => runner(index, stablecoin))
}

export function getUSDPrice(reserves) {
  const marketDetails = forEachStablecoin(i => getMarketDetails(reserves[i], undefined))
  const ethPrices = forEachStablecoin(i => marketDetails[i].marketRate.rateInverted)

  const [median] = getMedian(ethPrices)
  const [mean] = getMean(ethPrices)
  const [weightedMean] = getMean(
    ethPrices,
    forEachStablecoin(i => reserves[i].ethReserve.amount)
  )

  // const _stablecoinWeights = [
  //   getMean([medianWeights[0], meanWeights[0], weightedMeanWeights[0]])[0],
  //   getMean([medianWeights[1], meanWeights[1], weightedMeanWeights[1]])[0],
  //   getMean([medianWeights[2], meanWeights[2], weightedMeanWeights[2]])[0]
  // ]
  // const stablecoinWeights = forEachStablecoin((i, stablecoin) => ({
  //   [stablecoin]: _stablecoinWeights[i]
  // })).reduce((accumulator, currentValue) => ({ ...accumulator, ...currentValue }), {})

  return getMean([median, mean, weightedMean])[0]
}
