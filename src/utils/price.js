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
  return getMean([median, mean, weightedMean])[0]
}
