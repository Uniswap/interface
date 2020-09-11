import Calculator from './domain'
import { CalculatorState } from './reducer'
import { Field } from './actions'

interface Input {
  croUsdRate: string
  totalPoolLiquidityUsd: string
  allPoolStakedCroAmount: string
  myLiquidityUsd: string
  myCroStaked: string
  myStakeYear: string
  totalCropWeight: string
}

const stubCalculatorState = (input: Input): CalculatorState => {
  return {
    constants: {
      ratioCroStakedToDailyRewardPoolPercent: 0.1,
      minimumDailyRewardPool: 1000000
    },
    graphData: {
      liquidityProvidedUsd: input.myLiquidityUsd, // TODO: special handling for default value
      existingStakeList: [],
      totalCropWeight: input.totalCropWeight,
      allPoolStakedCroAmount: input.allPoolStakedCroAmount,
      croToUsdRate: input.croUsdRate,
      totalPoolLiquidityUsd: input.totalPoolLiquidityUsd,
      averageMultiplier: '1'
    },
    [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: input.myLiquidityUsd.toString(),
    [Field.TOTAL_STAKED_AMOUNT_CRO]: input.myCroStaked.toString(),
    [Field.STAKE_YEAR]: input.myStakeYear.toString()
  }
}

describe('calculator domain', () => {
  const initialState: CalculatorState = stubCalculatorState({
    croUsdRate: '0.18',
    allPoolStakedCroAmount: '0',
    myLiquidityUsd: '0',
    myCroStaked: '0',
    myStakeYear: '2',
    totalCropWeight: '6',
    totalPoolLiquidityUsd: '0'
  })
  describe('computeResult', () => {
    it('get empty default result', () => {
      expect(Calculator.computeResult(initialState)).toEqual({
        originalApyPercent: '0.00',
        newApyPercent: '0.00',
        annualizedCroRewards: '0.00'
      })
    })

    it('should get empty default result when there is no liquidity provided by user', () => {
      const calculatorState = stubCalculatorState({
        croUsdRate: '0.15',
        allPoolStakedCroAmount: '50000000',
        myLiquidityUsd: '0',
        myCroStaked: '0',
        myStakeYear: '2',
        totalCropWeight: '6',
        totalPoolLiquidityUsd: '0'
      })
      expect(Calculator.computeResult(calculatorState)).toEqual({
        originalApyPercent: '0.00',
        newApyPercent: '0.00',
        annualizedCroRewards: '0.00'
      })
    })

    it('should get empty default result when there is some liquidity provided by user, but no CRO staked', () => {
      const calculatorState = stubCalculatorState({
        croUsdRate: '0.15',
        allPoolStakedCroAmount: '50000000',
        myLiquidityUsd: '10000',
        myCroStaked: '0',
        myStakeYear: '2',
        totalCropWeight: '2000000',
        totalPoolLiquidityUsd: '75000000'
      })
      expect(Calculator.computeResult(calculatorState)).toEqual({
        originalApyPercent: '0.00',
        newApyPercent: '0.00',
        annualizedCroRewards: '0.00'
      })
    })

    it('should get non empty result when there is some liquidity provided by user, but with 1000 CRO staked', () => {
      const calculatorState = stubCalculatorState({
        croUsdRate: '0.15',
        allPoolStakedCroAmount: '50000000',
        myLiquidityUsd: '10000',
        myCroStaked: '1000',
        myStakeYear: '2',
        totalCropWeight: '2000000',
        totalPoolLiquidityUsd: '75000000'
      })
      expect(Calculator.computeResult(calculatorState)).toEqual({
        originalApyPercent: '0.00',
        newApyPercent: '87.59',
        annualizedCroRewards: '58,390.66'
      })
    })
  })
})
