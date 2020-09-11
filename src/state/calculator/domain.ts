import BigNumber from 'bignumber.js'
import { CalculatorState, CalculatorResult } from './reducer'
import { Field } from './actions'
import getMultiplierRange, { StakeYear } from '../../utils/multiplierRange'

export const emptyResult: CalculatorResult = {
  originalApyPercent: '0.00',
  newApyPercent: '0.00',
  annualizedCroRewards: '0.00'
}

const computeMultiplier = ({ croStaked, stakedYear }: { croStaked: BigNumber; stakedYear: number }): BigNumber => {
  stakedYear = croStaked.isZero() ? 1 : stakedYear
  return new BigNumber(getMultiplierRange(croStaked, stakedYear.toString() as StakeYear))
}

function dataPrep(state: CalculatorState) {
  const {
    totalCropWeight,
    totalPoolLiquidityUsd,
    allPoolStakedCroAmount,
    croToUsdRate,
    averageMultiplier
  } = state.graphData
  return {
    graphTotalCropWeight: new BigNumber(totalCropWeight),
    graphTotalPoolLiquidityUsd: new BigNumber(totalPoolLiquidityUsd),
    graphPoolCroStaked: new BigNumber(allPoolStakedCroAmount),
    graphCroToUsdRate: new BigNumber(croToUsdRate),
    graphAverageMultiplier: new BigNumber(averageMultiplier),
    myLiquidityProvidedUsd: new BigNumber(state[Field.TOTAL_LIQUIDITY_PROVIDED_USD] || 0),
    myCroStaked: new BigNumber(state[Field.TOTAL_STAKED_AMOUNT_CRO] || 0),
    myStakeYear: new BigNumber(state[Field.STAKE_YEAR]).toNumber()
  }
}

export default {
  computeResult(state: CalculatorState): CalculatorResult {
    const {
      graphTotalCropWeight,
      graphTotalPoolLiquidityUsd,
      graphPoolCroStaked,
      graphCroToUsdRate,
      graphAverageMultiplier,
      myLiquidityProvidedUsd,
      myCroStaked,
      myStakeYear
    } = dataPrep(state)

    if (graphPoolCroStaked.isZero()) {
      return emptyResult
    }

    if (myLiquidityProvidedUsd.isZero()) {
      return emptyResult
    }
    const totalLiquidityUsd = graphTotalPoolLiquidityUsd.plus(myLiquidityProvidedUsd)
    const multiplier = computeMultiplier({
      croStaked: myCroStaked,
      stakedYear: myStakeYear
    })
    const cropWeight = myLiquidityProvidedUsd
      .div(totalLiquidityUsd)
      .multipliedBy(multiplier)
      .multipliedBy(1000000)

    const remoteCropWeight = graphTotalPoolLiquidityUsd
      .div(totalLiquidityUsd)
      .multipliedBy(graphAverageMultiplier)
      .multipliedBy(1000000)

    const totalCropWeightDenominator = remoteCropWeight.plus(cropWeight)
    const dailyRewardPool = new BigNumber('1000000')
    const myShare = cropWeight.div(totalCropWeightDenominator).multipliedBy(dailyRewardPool)
    console.debug('multiplier', multiplier.toString())
    console.debug('cropWeight', cropWeight.toString())
    console.debug('remoteCropWeight', remoteCropWeight.toString())
    console.debug('totalCropWeightDenominator', totalCropWeightDenominator.toString())
    console.debug('dailyRewardPool', dailyRewardPool.toString())
    console.debug('myShare', myShare.toString())
    const annualizedCroRewards = myShare.multipliedBy(365)
    const apyPercent = annualizedCroRewards
      .multipliedBy(graphCroToUsdRate)
      .div(myLiquidityProvidedUsd)
      .multipliedBy(100)
    return {
      originalApyPercent: '0.00',
      newApyPercent: apyPercent.toFormat(2),
      annualizedCroRewards: annualizedCroRewards.toFormat(2)
    }
  }
}
