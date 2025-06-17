import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DepositContextType, DepositState } from 'components/Liquidity/types'
import { useCreateLiquidityContext } from 'pages/Pool/Positions/create/CreateLiquidityContextProvider'
import {
  CreatePositionContextType,
  DEFAULT_POSITION_STATE,
  PositionFlowStep,
  PriceRangeContextType,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import React, { useContext } from 'react'
import { PositionField } from 'types/position'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { CreatePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'

export const CreatePositionContext = React.createContext<CreatePositionContextType>({
  areTokensUnchanged: true,
  reset: () => undefined,
  step: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
  setStep: () => undefined,
  positionState: DEFAULT_POSITION_STATE,
  setPositionState: () => undefined,
  feeTierSearchModalOpen: false,
  setFeeTierSearchModalOpen: () => undefined,
  derivedPositionInfo: {
    protocolVersion: ProtocolVersion.V4,
    currencies: {
      display: { TOKEN0: undefined, TOKEN1: undefined },
      sdk: { TOKEN0: undefined, TOKEN1: undefined },
    },
    isPoolOutOfSync: false,
    refetchPoolData: () => undefined,
    defaultInitialPrice: undefined,
    isDefaultInitialPriceLoading: false,
  },
  dynamicFeeTierSpeedbumpData: {
    open: false,
    wishFeeData: DEFAULT_POSITION_STATE.fee,
  },
  setDynamicFeeTierSpeedbumpData: () => undefined,
  currentTransactionStep: undefined,
  setCurrentTransactionStep: () => undefined,
})

export const useCreatePositionContext = () => {
  const isCreateLiquidityRefactorEnabled = useFeatureFlag(FeatureFlags.CreateLiquidityRefactor)
  const createPositionContext = useContext(CreatePositionContext)
  const createLiquidityContext = useCreateLiquidityContext()

  if (isCreateLiquidityRefactorEnabled) {
    if (!createLiquidityContext) {
      throw new Error('CreateLiquidityContext not found')
    }
    return createLiquidityContext
  }

  return createPositionContext
}

export const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: true,
  minPrice: '',
  maxPrice: '',
  initialPrice: '',
}

export const PriceRangeContext = React.createContext<PriceRangeContextType>({
  reset: () => undefined,
  priceRangeState: DEFAULT_PRICE_RANGE_STATE,
  setPriceRangeState: () => undefined,
  derivedPriceRangeInfo: {
    protocolVersion: ProtocolVersion.V4,
    ticksAtLimit: [false, false],
    tickSpaceLimits: [0, 0],
    deposit0Disabled: false,
    deposit1Disabled: false,
    ticks: [0, 0],
    invalidPrice: false,
    invalidRange: false,
    outOfRange: false,
    prices: [undefined, undefined],
    pricesAtLimit: [undefined, undefined],
    pricesAtTicks: [undefined, undefined],
  },
})

export const usePriceRangeContext = () => {
  const isCreateLiquidityRefactorEnabled = useFeatureFlag(FeatureFlags.CreateLiquidityRefactor)
  const priceRangeContext = useContext(PriceRangeContext)
  const createLiquidityContext = useCreateLiquidityContext()

  if (isCreateLiquidityRefactorEnabled) {
    if (!createLiquidityContext) {
      throw new Error('CreateLiquidityContext not found')
    }
    return createLiquidityContext
  }

  return priceRangeContext
}

export const DEFAULT_DEPOSIT_STATE: DepositState = {
  exactField: PositionField.TOKEN0,
  exactAmounts: {},
}

export const DepositContext = React.createContext<DepositContextType>({
  reset: () => undefined,
  depositState: DEFAULT_DEPOSIT_STATE,
  setDepositState: () => undefined,
  derivedDepositInfo: {},
})

export const useDepositContext = () => {
  const isCreateLiquidityRefactorEnabled = useFeatureFlag(FeatureFlags.CreateLiquidityRefactor)
  const depositContext = useContext(DepositContext)
  const createLiquidityContext = useCreateLiquidityContext()

  if (isCreateLiquidityRefactorEnabled) {
    if (!createLiquidityContext) {
      throw new Error('CreateLiquidityContext not found')
    }
    return createLiquidityContext
  }

  return depositContext
}

export const CreateTxContext = React.createContext<{
  txInfo?: CreatePositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency> | null
  error: boolean | string
  refetch?: () => void
  dependentAmount?: string
}>({ error: false })

export const useCreateTxContext = () => {
  const isCreateLiquidityRefactorEnabled = useFeatureFlag(FeatureFlags.CreateLiquidityRefactor)
  const createTxContext = useContext(CreateTxContext)
  const createLiquidityContext = useCreateLiquidityContext()

  if (isCreateLiquidityRefactorEnabled) {
    if (!createLiquidityContext) {
      throw new Error('CreateLiquidityContext not found')
    }
    return createLiquidityContext
  }

  return createTxContext
}
