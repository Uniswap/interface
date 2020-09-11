import { createStore, Store } from 'redux'

import { Field, typeInput, fetchCalculatorGraphData } from './actions'
import reducer, { CalculatorState, initialState } from './reducer'

describe('calculator reducer', () => {
  let store: Store<CalculatorState>

  beforeEach(() => {
    store = createStore(reducer, {
      constants: {
        ratioCroStakedToDailyRewardPoolPercent: 0.1,
        minimumDailyRewardPool: 1000000
      },
      graphData: {
        liquidityProvidedUsd: '0',
        existingStakeList: [],
        totalCropWeight: '0',
        allPoolStakedCroAmount: '54000000',
        croToUsdRate: '0.18',
        totalPoolLiquidityUsd: '75000000',
        averageMultiplier: '1'
      },
      [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: '',
      [Field.TOTAL_STAKED_AMOUNT_CRO]: '',
      [Field.STAKE_YEAR]: '2'
    })
  })

  describe('fetchCalculatorGraphData', () => {
    describe('fulfilled', () => {
      it('saves the list', () => {
        store.dispatch(
          fetchCalculatorGraphData.fulfilled({
            graphData: {
              liquidityProvidedUsd: '123.0',
              existingStakeList: [],
              totalCropWeight: '123.0',
              allPoolStakedCroAmount: '56000000',
              croToUsdRate: '0.172',
              totalPoolLiquidityUsd: '75000000'
            },
            requestId: 'request-id',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          ...initialState,
          graphData: {
            liquidityProvidedUsd: '123.0',
            totalCropWeight: '123.0',
            existingStakeList: [],
            allPoolStakedCroAmount: '56000000',
            croToUsdRate: '0.172',
            totalPoolLiquidityUsd: '75000000'
          }
        })
      })
    })
  })

  describe('typeInput', () => {
    it('sets typed value', () => {
      store.dispatch(typeInput({ field: Field.TOTAL_LIQUIDITY_PROVIDED_USD, typedValue: '1.0' }))
      expect(store.getState()).toEqual({ ...initialState, [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: '1.0' })

      store.dispatch(typeInput({ field: Field.TOTAL_STAKED_AMOUNT_CRO, typedValue: '1.0' }))
      expect(store.getState()).toEqual({
        ...initialState,
        [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: '1.0',
        [Field.TOTAL_STAKED_AMOUNT_CRO]: '1.0'
      })

      store.dispatch(typeInput({ field: Field.STAKE_YEAR, typedValue: '1' }))
      expect(store.getState()).toEqual({
        ...initialState,
        [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: '1.0',
        [Field.TOTAL_STAKED_AMOUNT_CRO]: '1.0',
        [Field.STAKE_YEAR]: '1'
      })
    })
  })
})
