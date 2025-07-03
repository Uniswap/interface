import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { useCreatePositionDependentAmountFallback } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
// TODO: [WEB-7905: Remove added circular dependency to CreatePositionContext](https://linear.app/uniswap/issue/WEB-7905/remove-added-circular-dependency-to-createpositioncontext)
import {
  getDepositInfoProps,
  getPriceRangeInfo,
  useDepositInfo,
  useDerivedPositionInfo,
} from 'pages/Pool/Positions/create/hooks'
import {
  CreatePositionInfo,
  DynamicFeeTierSpeedbumpData,
  PositionFlowStep,
  PositionState,
  PriceRangeInfo,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import {
  generateAddLiquidityApprovalParams,
  generateCreateCalldataQueryParams,
  generateCreatePositionTxRequest,
} from 'pages/Pool/Positions/create/utils'
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PositionField } from 'types/position'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { CreatePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: true,
  minPrice: '',
  maxPrice: '',
  initialPrice: '',
}

const DEFAULT_DEPOSIT_STATE: DepositState = {
  exactField: PositionField.TOKEN0,
  exactAmounts: {},
}

const DEFAULT_FEE_DATA = {
  feeAmount: FeeAmount.MEDIUM,
  tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
  isDynamic: false,
}

const DEFAULT_POSITION_STATE: PositionState = {
  fee: DEFAULT_FEE_DATA,
  hook: undefined,
  userApprovedHook: undefined,
  protocolVersion: ProtocolVersion.V4,
}

// Combined state interface
interface CreateLiquidityState {
  // From CreatePositionContext
  areTokensUnchanged: boolean
  positionState: PositionState
  step: PositionFlowStep
  currentTransactionStep?: { step: TransactionStep; accepted: boolean }
  feeTierSearchModalOpen: boolean
  dynamicFeeTierSpeedbumpData: DynamicFeeTierSpeedbumpData

  // From PriceRangeContext
  priceRangeState: PriceRangeState

  // From DepositContext
  depositState: DepositState
}

// Combined context value interface
// eslint-disable-next-line
export interface CreateLiquidityContextType extends CreateLiquidityState {
  // Setters
  setPositionState: React.Dispatch<React.SetStateAction<PositionState>>
  setCurrencyInputs: React.Dispatch<React.SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
  setStep: React.Dispatch<React.SetStateAction<PositionFlowStep>>
  setCurrentTransactionStep: React.Dispatch<
    React.SetStateAction<{ step: TransactionStep; accepted: boolean } | undefined>
  >
  setFeeTierSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setDynamicFeeTierSpeedbumpData: React.Dispatch<React.SetStateAction<DynamicFeeTierSpeedbumpData>>
  setPriceRangeState: React.Dispatch<React.SetStateAction<PriceRangeState>>
  setDepositState: React.Dispatch<React.SetStateAction<DepositState>>

  // Derived info
  derivedPositionInfo: CreatePositionInfo
  derivedPriceRangeInfo: PriceRangeInfo
  derivedDepositInfo: DepositInfo

  // Transaction info (from CreateTxContext)
  txInfo?: CreatePositionTxAndGasInfo
  gasFeeEstimateUSD: CurrencyAmount<Currency> | null
  error: string | boolean
  refetch?: () => void
  dependentAmount?: string

  // Reset functions
  reset: () => void
  resetPriceRange: () => void
  resetDeposit: () => void
}

const CreateLiquidityContext = createContext<CreateLiquidityContextType | undefined>(undefined)

export function CreateLiquidityContextProvider({
  children,
  initialState = {},
  currencyInputs,
  setCurrencyInputs,
}: {
  children: React.ReactNode
  initialState?: Partial<PositionState>
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
}) {
  const account = useAccountMeta()
  // Combined state from all 4 providers
  const initialCurrencyInputs = useRef(currencyInputs).current

  const [positionState, setPositionState] = useState<PositionState>({ ...DEFAULT_POSITION_STATE, ...initialState })
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)
  const [dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData] = useState<DynamicFeeTierSpeedbumpData>({
    open: false,
    wishFeeData: DEFAULT_POSITION_STATE.fee,
  })

  // Price range state
  const initialPosition = positionState.initialPosition
  const fullRange = initialPosition?.isOutOfRange ? false : true
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>({ ...DEFAULT_PRICE_RANGE_STATE, fullRange })

  // Deposit state
  const [depositState, setDepositState] = useState<DepositState>(DEFAULT_DEPOSIT_STATE)

  // Derived info
  const derivedPositionInfo = useDerivedPositionInfo(currencyInputs, positionState)
  const derivedPriceRangeInfo = useMemo(() => {
    return getPriceRangeInfo({ derivedPositionInfo, state: priceRangeState, positionState })
  }, [derivedPositionInfo, priceRangeState, positionState])
  const depositInfoProps = useMemo(() => {
    return getDepositInfoProps({
      address: account?.address,
      derivedPositionInfo,
      state: depositState,
      derivedPriceRangeInfo,
    })
  }, [account?.address, derivedPositionInfo, depositState, derivedPriceRangeInfo])
  const derivedDepositInfo = useDepositInfo(depositInfoProps)

  // Reset functions
  const reset = useEvent(() => {
    setPositionState({ ...DEFAULT_POSITION_STATE, ...initialState })
    setCurrencyInputs(initialCurrencyInputs)
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  })

  const resetPriceRange = useEvent(() => {
    setPriceRangeState(DEFAULT_PRICE_RANGE_STATE)
  })

  const resetDeposit = useEvent(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
  })

  useEffect(() => {
    setPriceRangeState({ ...DEFAULT_PRICE_RANGE_STATE, fullRange })
  }, [fullRange])

  useEffect(() => {
    setPriceRangeState((prevState) => {
      if (prevState.fullRange) {
        return { ...prevState, fullRange, minPrice: '', maxPrice: '' }
      } else {
        return { ...prevState, fullRange: false, minPrice: undefined, maxPrice: undefined }
      }
    })
  }, [priceRangeState.priceInverted, fullRange])

  useEffect(() => {
    if (derivedPriceRangeInfo.deposit1Disabled) {
      setDepositState((prev) => ({ ...prev, exactField: PositionField.TOKEN0 }))
    } else if (derivedPriceRangeInfo.deposit0Disabled) {
      setDepositState((prev) => ({ ...prev, exactField: PositionField.TOKEN1 }))
    }
  }, [derivedPriceRangeInfo.deposit0Disabled, derivedPriceRangeInfo.deposit1Disabled])

  // Transaction logic (from CreateTxContextProvider)
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsContext()
  const generatePermitAsTransaction = useUniswapContext().getCanSignPermits?.(derivedPositionInfo.chainId)

  const hasError = Boolean(derivedDepositInfo.error)
  const [hasCreateErrorResponse, setHasCreateErrorResponse] = useState(false)

  const invalidRange =
    derivedPriceRangeInfo.protocolVersion !== ProtocolVersion.V2 && derivedPriceRangeInfo.invalidRange

  const addLiquidityApprovalParams = useMemo(() => {
    return generateAddLiquidityApprovalParams({
      account,
      positionState,
      derivedPositionInfo,
      derivedDepositInfo,
      generatePermitAsTransaction,
    })
  }, [account, derivedDepositInfo, derivedPositionInfo, positionState, generatePermitAsTransaction])

  const {
    data: approvalCalldata,
    error: approvalError,
    isLoading: approvalLoading,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    retry: false,
    enabled: !!addLiquidityApprovalParams && !hasError && !hasCreateErrorResponse && !invalidRange,
  })

  if (approvalError) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: { file: 'CreateLiquidityContextProvider', function: 'useEffect' },
    })
  }

  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.chainId,
    approvalCalldata?.gasFeeToken0Approval,
  )
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.chainId,
    approvalCalldata?.gasFeeToken1Approval,
  )
  const gasFeeToken0PermitUSD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.chainId,
    approvalCalldata?.gasFeeToken0Permit,
  )
  const gasFeeToken1PermitUSD = useUSDCurrencyAmountOfGasFee(
    derivedPositionInfo.chainId,
    approvalCalldata?.gasFeeToken1Permit,
  )

  const createCalldataQueryParams = useMemo(() => {
    return generateCreateCalldataQueryParams({
      account,
      approvalCalldata,
      positionState,
      derivedPositionInfo,
      priceRangeState,
      derivedPriceRangeInfo,
      derivedDepositInfo,
      independentField: depositState.exactField,
      slippageTolerance: customSlippageTolerance,
    })
  }, [
    account,
    approvalCalldata,
    derivedDepositInfo,
    derivedPositionInfo,
    derivedPriceRangeInfo,
    positionState,
    priceRangeState,
    depositState.exactField,
    customSlippageTolerance,
  ])

  const isUserCommittedToCreate =
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransactionAsync

  const isQueryEnabled =
    !isUserCommittedToCreate &&
    !hasError &&
    !approvalLoading &&
    !approvalError &&
    !invalidRange &&
    Boolean(approvalCalldata) &&
    Boolean(createCalldataQueryParams)

  const {
    data: createCalldata,
    error: createError,
    refetch: createRefetch,
  } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: hasCreateErrorResponse ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  useEffect(() => {
    setHasCreateErrorResponse(!!createError)
  }, [createError, createCalldataQueryParams, addLiquidityApprovalParams])

  if (createError) {
    const message = parseErrorMessageTitle(createError, { defaultTitle: 'unknown CreateLpPositionCalldataQuery' })
    logger.error(message, {
      tags: { file: 'CreateLiquidityContextProvider', function: 'useEffect' },
    })

    if (createCalldataQueryParams) {
      sendAnalyticsEvent(InterfaceEventName.CreatePositionFailed, {
        message,
        ...createCalldataQueryParams,
      })
    }
  }

  const dependentAmountFallback = useCreatePositionDependentAmountFallback(
    createCalldataQueryParams,
    isQueryEnabled && Boolean(createError),
  )

  const actualGasFee = createCalldata?.gasFee
  const needsApprovals = !!(
    approvalCalldata?.token0Approval ||
    approvalCalldata?.token1Approval ||
    approvalCalldata?.token0Cancel ||
    approvalCalldata?.token1Cancel ||
    approvalCalldata?.token0PermitTransaction ||
    approvalCalldata?.token1PermitTransaction
  )
  const { value: calculatedGasFee } = useTransactionGasFee({
    tx: createCalldata?.create,
    skip: !!actualGasFee || needsApprovals,
  })
  const increaseGasFeeUsd = useUSDCurrencyAmountOfGasFee(
    toSupportedChainId(createCalldata?.create?.chainId) ?? undefined,
    actualGasFee || calculatedGasFee,
  )

  const totalGasFee = useMemo(() => {
    const fees = [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD]
    return fees.reduce((total, fee) => {
      if (fee && total) {
        return total.add(fee)
      }
      return total || fee
    })
  }, [gasFeeToken0USD, gasFeeToken1USD, increaseGasFeeUsd, gasFeeToken0PermitUSD, gasFeeToken1PermitUSD])

  const txInfo = useMemo(() => {
    return generateCreatePositionTxRequest({
      approvalCalldata,
      createCalldata,
      createCalldataQueryParams,
      derivedPositionInfo,
      derivedDepositInfo,
    })
  }, [approvalCalldata, createCalldata, createCalldataQueryParams, derivedPositionInfo, derivedDepositInfo])

  const value: CreateLiquidityContextType = {
    // State
    areTokensUnchanged: currencyInputs.tokenA === initialCurrencyInputs.tokenA && !currencyInputs.tokenB,
    positionState,
    step,
    currentTransactionStep,
    feeTierSearchModalOpen,
    dynamicFeeTierSpeedbumpData,
    priceRangeState,
    depositState,
    // Setters
    setPositionState,
    setStep,
    setCurrentTransactionStep,
    setFeeTierSearchModalOpen,
    setDynamicFeeTierSpeedbumpData,
    setPriceRangeState,
    setDepositState,
    setCurrencyInputs,
    // Derived info
    derivedPositionInfo,
    derivedPriceRangeInfo,
    derivedDepositInfo,
    // Transaction info
    txInfo,
    gasFeeEstimateUSD: totalGasFee,
    error: getErrorMessageToDisplay({ approvalError, calldataError: createError }),
    // Refetch functions
    refetch: approvalError ? approvalRefetch : createError ? createRefetch : undefined,
    // Dependent amount
    dependentAmount: createError && dependentAmountFallback ? dependentAmountFallback : createCalldata?.dependentAmount,
    // Reset functions
    reset,
    resetPriceRange,
    resetDeposit,
  }

  return <CreateLiquidityContext.Provider value={value}>{children}</CreateLiquidityContext.Provider>
}

export function useCreateLiquidityContext(): CreateLiquidityContextType | undefined {
  const isCreateLiquidityRefactorEnabled = useFeatureFlag(FeatureFlags.CreateLiquidityRefactor)
  const context = useContext(CreateLiquidityContext)
  if (!context && isCreateLiquidityRefactorEnabled) {
    throw new Error('useCreateLiquidityContext must be used within a CreateLiquidityContextProvider')
  }
  return context
}
