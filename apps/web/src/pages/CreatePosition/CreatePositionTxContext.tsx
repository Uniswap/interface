/* eslint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, MaxUint256, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Interface } from '@ethersproject/abi'
import { TradingApi } from '@universe/api'
import { useDepositInfo } from 'components/Liquidity/Create/hooks/useDepositInfo'
import { useOnChainLpApproval } from 'components/Liquidity/Create/hooks/useOnChainLpApproval'
import { DYNAMIC_FEE_DATA, PositionState } from 'components/Liquidity/Create/types'
import { useCreatePositionDependentAmountFallback } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { getTokenOrZeroAddress, validateCurrencyInput } from 'components/Liquidity/utils/currency'
import { isInvalidRange, isOutOfRange } from 'components/Liquidity/utils/priceRangeInfo'
import { getProtocolItems } from 'components/Liquidity/utils/protocolVersion'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PositionField } from 'types/position'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { CreatePositionTxAndGasInfo, LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Check if a chain ID is a HashKey chain
 */
function isHashKeyChain(chainId: number | undefined): boolean {
  return chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet
}

/**
 * @internal - exported for testing
 */
export function generateAddLiquidityApprovalParams({
  address,
  protocolVersion,
  displayCurrencies,
  currencyAmounts,
  canBatchTransactions,
}: {
  address?: string
  protocolVersion: ProtocolVersion
  displayCurrencies: { [field in PositionField]: Maybe<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  canBatchTransactions?: boolean
}): TradingApi.CheckApprovalLPRequest | undefined {
  const apiProtocolItems = getProtocolItems(protocolVersion)

  if (
    !address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(displayCurrencies)
  ) {
    return undefined
  }

  return {
    simulateTransaction: true,
    walletAddress: address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    protocol: apiProtocolItems,
    token0: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
    token1: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
    amount0: currencyAmounts.TOKEN0.quotient.toString(),
    amount1: currencyAmounts.TOKEN1.quotient.toString(),
    generatePermitAsTransaction: undefined, // HashKey Chain only supports V3, no V4 permit support
  } satisfies TradingApi.CheckApprovalLPRequest
}

/**
 * @internal - exported for testing
 */
export function generateCreateCalldataQueryParams({
  protocolVersion,
  creatingPoolOrPair,
  account,
  approvalCalldata,
  positionState,
  ticks,
  poolOrPair,
  displayCurrencies,
  currencyAmounts,
  independentField,
  slippageTolerance,
}: {
  protocolVersion: ProtocolVersion
  creatingPoolOrPair: boolean | undefined
  account?: AccountDetails
  approvalCalldata?: TradingApi.CheckApprovalLPResponse
  positionState: PositionState
  ticks: [Maybe<number>, Maybe<number>]
  poolOrPair: V3Pool | Pair | undefined
  displayCurrencies: { [field in PositionField]: Maybe<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  independentField: PositionField
  slippageTolerance?: number
}): TradingApi.CreateLPPositionRequest | undefined {
  const apiProtocolItems = getProtocolItems(protocolVersion)

  if (
    !account?.address ||
    !apiProtocolItems ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(displayCurrencies) ||
    !positionState.fee // Ensure fee is defined
  ) {
    return undefined
  }

  const {
    token0Approval,
    token1Approval,
    positionTokenApproval,
    permitData,
    token0PermitTransaction,
    token1PermitTransaction,
  } = approvalCalldata ?? {}

  if (protocolVersion === ProtocolVersion.V2) {
    if (protocolVersion !== positionState.protocolVersion) {
      return undefined
    }

    const pair = poolOrPair

    if (!pair || !displayCurrencies.TOKEN0 || !displayCurrencies.TOKEN1) {
      return undefined
    }

    const independentToken =
      independentField === PositionField.TOKEN0
        ? TradingApi.IndependentToken.TOKEN_0
        : TradingApi.IndependentToken.TOKEN_1
    const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
    const independentAmount = currencyAmounts[independentField]
    const dependentAmount = currencyAmounts[dependentField]

    return {
      simulateTransaction: !(
        permitData ||
        token0PermitTransaction ||
        token1PermitTransaction ||
        token0Approval ||
        token1Approval ||
        positionTokenApproval
      ),
      protocol: apiProtocolItems,
      walletAddress: account.address,
      chainId: currencyAmounts.TOKEN0.currency.chainId,
      independentAmount: independentAmount?.quotient.toString(),
      independentToken,
      defaultDependentAmount: dependentAmount?.quotient.toString(),
      slippageTolerance,
      position: {
        pool: {
          token0: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
          token1: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
        },
      },
    } satisfies TradingApi.CreateLPPositionRequest
  }

  if (protocolVersion !== positionState.protocolVersion) {
    return undefined
  }

  const pool = poolOrPair as V3Pool | undefined
  if (!pool || !displayCurrencies.TOKEN0 || !displayCurrencies.TOKEN1) {
    return undefined
  }

  const tickLower = ticks[0]
  const tickUpper = ticks[1]

  if (tickLower === undefined || tickUpper === undefined) {
    return undefined
  }

  const initialPrice = creatingPoolOrPair ? pool.sqrtRatioX96.toString() : undefined
  const tickSpacing = pool.tickSpacing

  const independentToken =
    independentField === PositionField.TOKEN0
      ? TradingApi.IndependentToken.TOKEN_0
      : TradingApi.IndependentToken.TOKEN_1
  const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  const independentAmount = currencyAmounts[independentField]
  const dependentAmount = currencyAmounts[dependentField]

  // Ensure fee is defined
  if (!positionState.fee?.feeAmount) {
    return undefined
  }

  // V3 pool configuration (HashKey Chain only supports V3)
  const poolConfig: any = {
    tickSpacing,
    token0: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
    token1: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
    fee: positionState.fee.isDynamic ? DYNAMIC_FEE_DATA.feeAmount : positionState.fee.feeAmount,
  }

  return {
    simulateTransaction: !(
      permitData ||
      token0PermitTransaction ||
      token1PermitTransaction ||
      token0Approval ||
      token1Approval ||
      positionTokenApproval
    ),
    protocol: apiProtocolItems,
    walletAddress: account.address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    independentAmount: independentAmount?.quotient.toString(),
    independentToken,
    initialDependentAmount: initialPrice && dependentAmount?.quotient.toString(), // only set this if there is an initialPrice
    initialPrice,
    slippageTolerance,
    position: {
      tickLower: tickLower ?? undefined,
      tickUpper: tickUpper ?? undefined,
      pool: poolConfig,
    },
  } satisfies TradingApi.CreateLPPositionRequest
}

/**
 * @internal - exported for testing
 */
export function generateCreatePositionTxRequest({
  protocolVersion,
  approvalCalldata,
  createCalldata,
  createCalldataQueryParams,
  currencyAmounts,
  poolOrPair,
  canBatchTransactions,
}: {
  protocolVersion: ProtocolVersion
  approvalCalldata?: TradingApi.CheckApprovalLPResponse
  createCalldata?: TradingApi.CreateLPPositionResponse
  createCalldataQueryParams?: TradingApi.CreateLPPositionRequest
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  poolOrPair: V3Pool | Pair | undefined
  canBatchTransactions: boolean
}): CreatePositionTxAndGasInfo | undefined {
  if (!currencyAmounts?.TOKEN0 || !currencyAmounts.TOKEN1) {
    return undefined
  }

  // For HashKey chains, Trading API doesn't support creating LP positions
  // So createCalldata will be undefined, and we'll use async step instead
  const chainId = currencyAmounts.TOKEN0.currency.chainId
  const isHashKey = isHashKeyChain(chainId)
  
  // For non-HashKey chains, createCalldata is required
  if (!isHashKey && !createCalldata) {
    return undefined
  }

  const validatedApprove0Request = validateTransactionRequest(approvalCalldata?.token0Approval)
  if (approvalCalldata?.token0Approval && !validatedApprove0Request) {
    return undefined
  }

  const validatedApprove1Request = validateTransactionRequest(approvalCalldata?.token1Approval)
  if (approvalCalldata?.token1Approval && !validatedApprove1Request) {
    return undefined
  }

  const validatedRevoke0Request = validateTransactionRequest(approvalCalldata?.token0Cancel)
  if (approvalCalldata?.token0Cancel && !validatedRevoke0Request) {
    return undefined
  }

  const validatedRevoke1Request = validateTransactionRequest(approvalCalldata?.token1Cancel)
  if (approvalCalldata?.token1Cancel && !validatedRevoke1Request) {
    return undefined
  }

  const validatedPermitRequest = validatePermit(approvalCalldata?.permitData)
  if (approvalCalldata?.permitData && !validatedPermitRequest) {
    return undefined
  }

  const validatedToken0PermitTransaction = validateTransactionRequest(approvalCalldata?.token0PermitTransaction)
  const validatedToken1PermitTransaction = validateTransactionRequest(approvalCalldata?.token1PermitTransaction)

  // For HashKey chains, we don't have createCalldata from Trading API
  // So txRequest will be undefined, and we'll use async step with createPositionRequestArgs
  const txRequest = createCalldata?.create ? validateTransactionRequest(createCalldata.create) : undefined
  
  // For HashKey chains, allow missing txRequest (will use async step)
  // For other chains, require txRequest unless using permit transactions
  if (!isHashKey && !txRequest && !(validatedToken0PermitTransaction || validatedToken1PermitTransaction)) {
    // Allow missing txRequest if mismatched (unsigned flow using token0PermitTransaction/2)
    return undefined
  }

  // HashKey Chain only supports V3, so no need for V4-specific batchPermitData handling
  const queryParams: TradingApi.CreateLPPositionRequest | undefined = createCalldataQueryParams

  // For HashKey chains, get sqrtRatioX96 from poolOrPair if available (V3 pools only)
  // For other chains, get it from createCalldata
  let sqrtRatioX96: string | undefined
  if (isHashKey && poolOrPair && protocolVersion !== ProtocolVersion.V2) {
    // For V3, poolOrPair is a V3Pool, not a Pair
    const pool = poolOrPair as V3Pool
    sqrtRatioX96 = pool.sqrtRatioX96.toString()
  }
  if (!sqrtRatioX96) {
    sqrtRatioX96 = createCalldata?.sqrtRatioX96
  }

  return {
    type: LiquidityTransactionType.Create,
    canBatchTransactions,
    unsigned: Boolean(validatedPermitRequest),
    createPositionRequestArgs: queryParams,
    action: {
      type: LiquidityTransactionType.Create,
      currency0Amount: currencyAmounts.TOKEN0,
      currency1Amount: currencyAmounts.TOKEN1,
      liquidityToken: protocolVersion === ProtocolVersion.V2 && poolOrPair && 'liquidityToken' in poolOrPair
        ? (poolOrPair as Pair).liquidityToken
        : undefined,
    },
    approveToken0Request: validatedApprove0Request,
    approveToken1Request: validatedApprove1Request,
    txRequest,
    approvePositionTokenRequest: undefined,
    revokeToken0Request: validatedRevoke0Request,
    revokeToken1Request: validatedRevoke1Request,
    permit: validatedPermitRequest ? { method: PermitMethod.TypedData, typedData: validatedPermitRequest } : undefined,
    token0PermitTransaction: validatedToken0PermitTransaction,
    token1PermitTransaction: validatedToken1PermitTransaction,
    positionTokenPermitTransaction: undefined,
    sqrtRatioX96,
  } satisfies CreatePositionTxAndGasInfo
}

interface CreatePositionTxContextType {
  txInfo?: CreatePositionTxAndGasInfo
  gasFeeEstimateUSD?: Maybe<CurrencyAmount<Currency>>
  transactionError: boolean | string
  setTransactionError: Dispatch<SetStateAction<string | boolean>>
  dependentAmount?: string
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  inputError?: ReactNode
  formattedAmounts?: { [field in PositionField]?: string }
  currencyAmountsUSDValue?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
}

const CreatePositionTxContext = createContext<CreatePositionTxContextType | undefined>(undefined)

export function CreatePositionTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const {
    protocolVersion,
    currencies,
    ticks,
    poolOrPair: rawPoolOrPair,
    depositState,
    creatingPoolOrPair,
    currentTransactionStep,
    positionState,
    setRefetch,
  } = useCreateLiquidityContext()
  
  // Filter out V4 pools - HashKey Chain only supports V3
  const poolOrPair = useMemo(() => {
    if (!rawPoolOrPair) return undefined
    // If it's a Pair (V2), return as is
    if ('liquidityToken' in rawPoolOrPair) {
      return rawPoolOrPair
    }
    // If it's a V3Pool (has 'fee' and 'tickSpacing' properties), return as is
    if ('fee' in rawPoolOrPair && 'tickSpacing' in rawPoolOrPair && 'token0' in rawPoolOrPair) {
      const token0 = rawPoolOrPair.token0
      // V3Pool has Token, V4Pool has Currency - check if token0 is Token
      if ('address' in token0) {
        return rawPoolOrPair as V3Pool
      }
    }
    // Otherwise, it's V4Pool, return undefined for HashKey chains
    return undefined
  }, [rawPoolOrPair])

  const account = useWallet().evmAccount

  if (!currencies?.display) {
    throw new TypeError('currencies.display is undefined in CreatePositionTxContext')
  }
  
  const { TOKEN0, TOKEN1 } = currencies.display
  
  if (!depositState) {
    throw new TypeError('depositState is undefined in CreatePositionTxContext')
  }
  
  const { exactField } = depositState

  let invalidRange: boolean
  try {
    invalidRange = protocolVersion !== ProtocolVersion.V2 && isInvalidRange(ticks?.[0], ticks?.[1])
  } catch (error) {
    invalidRange = false // Default to false on error
  }

  const depositInfoProps = useMemo(() => {
    try {
      const [tickLower, tickUpper] = ticks || [undefined, undefined]
      const outOfRange = isOutOfRange({
        poolOrPair,
        lowerTick: tickLower,
        upperTick: tickUpper,
      })

      return {
        protocolVersion,
        poolOrPair,
        address: account?.address,
        token0: TOKEN0,
        token1: TOKEN1,
        tickLower: protocolVersion !== ProtocolVersion.V2 ? (tickLower ?? undefined) : undefined,
        tickUpper: protocolVersion !== ProtocolVersion.V2 ? (tickUpper ?? undefined) : undefined,
        exactField,
        exactAmounts: depositState?.exactAmounts,
        skipDependentAmount: protocolVersion === ProtocolVersion.V2 ? false : outOfRange || invalidRange,
      }
    } catch (error) {
      // Return minimal props on error
      return {
        protocolVersion,
        poolOrPair,
        address: account?.address,
        token0: TOKEN0,
        token1: TOKEN1,
        tickLower: undefined,
        tickUpper: undefined,
        exactField,
        exactAmounts: depositState?.exactAmounts,
        skipDependentAmount: true, // Skip dependent amount on error
      }
    }
  }, [TOKEN0, TOKEN1, exactField, ticks, poolOrPair, depositState, account?.address, protocolVersion, invalidRange])

  const {
    currencyAmounts,
    error: inputError,
    formattedAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
  } = useDepositInfo(depositInfoProps)

  const { customDeadline, customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
  }))
  const canBatchTransactions =
    (useUniswapContextSelector((ctx) => ctx.getCanBatchTransactions?.(poolOrPair?.chainId)) ?? false) &&
    poolOrPair?.chainId !== UniverseChainId.Monad

  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  // Check if this is a HashKey chain (Trading API doesn't support HashKey chains)
  const isHashKey = isHashKeyChain(poolOrPair?.chainId)

  // Use on-chain approval check for HashKey chains
  const token0Amount = useMemo(() => {
    const amount = currencyAmounts?.TOKEN0
    if (!amount || !(amount.currency instanceof Token)) return undefined
    return amount as CurrencyAmount<Token>
  }, [currencyAmounts?.TOKEN0])

  const token1Amount = useMemo(() => {
    const amount = currencyAmounts?.TOKEN1
    if (!amount || !(amount.currency instanceof Token)) return undefined
    return amount as CurrencyAmount<Token>
  }, [currencyAmounts?.TOKEN1])

  const onChainApproval = useOnChainLpApproval({
    token0: TOKEN0 instanceof Token ? TOKEN0 : undefined,
    token1: TOKEN1 instanceof Token ? TOKEN1 : undefined,
    amount0: token0Amount,
    amount1: token1Amount,
    owner: account?.address,
    chainId: poolOrPair?.chainId,
  })

  // Build approval transaction requests for HashKey chains based on on-chain check
  // Supports both traditional ERC20 approve and Permit2 authorization
  const hashKeyApprovalCalldata = useMemo(() => {
    try {
      if (!isHashKey || !onChainApproval.positionManagerAddress || !poolOrPair?.chainId) {
        return undefined
      }

      const positionManagerAddress = onChainApproval.positionManagerAddress
      const approveInterface = new Interface(['function approve(address spender,uint256 value)'])
      
      // Only build approval transactions if needed (considering Permit2 authorization)
      // If Permit2 authorization is valid, we don't need traditional approve
      const token0NeedsApproval = onChainApproval.token0NeedsApproval && TOKEN0 instanceof Token && currencyAmounts?.TOKEN0
      const token1NeedsApproval = onChainApproval.token1NeedsApproval && TOKEN1 instanceof Token && currencyAmounts?.TOKEN1

      const token0ApprovalTx = token0NeedsApproval && TOKEN0 instanceof Token && positionManagerAddress
        ? {
            to: TOKEN0.address,
            data: approveInterface.encodeFunctionData('approve', [
              positionManagerAddress,
              MaxUint256.toString(),
            ]),
            value: '0x0',
            chainId: poolOrPair.chainId,
          }
        : undefined

      const token1ApprovalTx = token1NeedsApproval && TOKEN1 instanceof Token && positionManagerAddress
        ? {
            to: TOKEN1.address,
            data: approveInterface.encodeFunctionData('approve', [
              positionManagerAddress,
              MaxUint256.toString(),
            ]),
            value: '0x0',
            chainId: poolOrPair.chainId,
          }
        : undefined

      // Return in Trading API format for compatibility
      // Only include approvals if they are needed
      const token0Approval = token0ApprovalTx ? validateTransactionRequest(token0ApprovalTx) : undefined
      const token1Approval = token1ApprovalTx ? validateTransactionRequest(token1ApprovalTx) : undefined

      // Note: Permit2 permit transactions (token0PermitTransaction/token1PermitTransaction) 
      // are typically generated by Trading API. For HashKey Chain, we currently only support
      // traditional approve transactions. If Permit2 authorization exists and is valid,
      // no approval transactions are needed.

      // Return undefined if no approvals needed (similar to Trading API behavior)
      if (!token0Approval && !token1Approval) {
        return undefined
      }

      return {
        token0Approval,
        token1Approval,
        // TODO: Add Permit2 permit transaction support for HashKey Chain if needed
        // token0PermitTransaction: ...,
        // token1PermitTransaction: ...,
      } as TradingApi.CheckApprovalLPResponse | undefined
    } catch (error) {
      return undefined
    }
  }, [
    isHashKey,
    onChainApproval.positionManagerAddress,
    onChainApproval.token0NeedsApproval,
    onChainApproval.token1NeedsApproval,
    onChainApproval.token0NeedsPermit2Approval,
    onChainApproval.token1NeedsPermit2Approval,
    TOKEN0,
    TOKEN1,
    currencyAmounts,
    poolOrPair?.chainId,
  ])

  const addLiquidityApprovalParams = useMemo(() => {
    if (!currencies?.display) {
      return undefined
    }
    return generateAddLiquidityApprovalParams({
      address: account?.address,
      protocolVersion,
      displayCurrencies: currencies.display,
      currencyAmounts,
      canBatchTransactions,
    })
  }, [account?.address, protocolVersion, currencies?.display, currencyAmounts, canBatchTransactions])

  // For HashKey chains, skip Trading API and use on-chain check
  const shouldEnableTradingApiApprovalQuery =
    !!addLiquidityApprovalParams && !inputError && !transactionError && !invalidRange && !isHashKey

  const {
    data: tradingApiApprovalCalldata,
    error: approvalError,
    isLoading: approvalLoading,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
    retry: false,
    enabled: shouldEnableTradingApiApprovalQuery,
  })

  // Use on-chain approval data for HashKey chains, Trading API data for others
  const approvalCalldata = isHashKey ? hashKeyApprovalCalldata : tradingApiApprovalCalldata

  if (approvalError && !isHashKey) {
    const message = parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    logger.error(message, {
      tags: { file: 'CreatePositionTxContext', function: 'useEffect' },
    })
  }

  const gasFeeToken0USD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken0Approval)
  const gasFeeToken1USD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken1Approval)
  const gasFeeToken0PermitUSD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken0Permit)
  const gasFeeToken1PermitUSD = useUSDCurrencyAmountOfGasFee(poolOrPair?.chainId, approvalCalldata?.gasFeeToken1Permit)

  const createCalldataQueryParams = useMemo(() => {
    if (!currencies?.display || !depositState) {
      return undefined
    }
    return generateCreateCalldataQueryParams({
      account,
      approvalCalldata,
      positionState,
      protocolVersion,
      creatingPoolOrPair,
      displayCurrencies: currencies.display,
      ticks,
      poolOrPair: poolOrPair as V3Pool | Pair | undefined, // Filter out V4Pool - HashKey Chain only supports V3
      currencyAmounts,
      independentField: depositState.exactField,
      slippageTolerance: customSlippageTolerance,
    })
  }, [
    account,
    approvalCalldata,
    currencyAmounts,
    creatingPoolOrPair,
    ticks,
    poolOrPair,
    positionState,
    depositState?.exactField,
    customSlippageTolerance,
    currencies?.display,
    protocolVersion,
  ])

  const isUserCommittedToCreate =
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransaction ||
    currentTransactionStep?.step.type === TransactionStepType.IncreasePositionTransactionAsync

  // For HashKey chains, we don't require approvalCalldata from Trading API
  // For other chains, approvalCalldata is required
  const requiresApprovalCalldata = !isHashKey

  // For HashKey chains, Trading API doesn't support creating LP positions
  // So we disable the query entirely for HashKey chains
  const isQueryEnabled =
    !isHashKey && // Disable Trading API query for HashKey chains
    !isUserCommittedToCreate &&
    !inputError &&
    !transactionError &&
    !approvalLoading &&
    !approvalError &&
    !invalidRange &&
    (requiresApprovalCalldata ? Boolean(approvalCalldata) : true) &&
    Boolean(createCalldataQueryParams)

  const {
    data: createCalldata,
    error: createError,
    refetch: createRefetch,
  } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled: isQueryEnabled,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: +createCalldataQueryParams, +addLiquidityApprovalParams
  useEffect(() => {
    setRefetch(() => (approvalError ? approvalRefetch : createError ? createRefetch : undefined)) // this must set it as a function otherwise it will actually call createRefetch immediately
  }, [
    approvalError,
    createError,
    createCalldataQueryParams,
    addLiquidityApprovalParams,
    setTransactionError,
    setRefetch,
    createRefetch,
    approvalRefetch,
  ])

  useEffect(() => {
    setTransactionError(getErrorMessageToDisplay({ approvalError, calldataError: createError }))
  }, [approvalError, createError])

  if (createError) {
    const message = parseErrorMessageTitle(createError, { defaultTitle: 'unknown CreateLpPositionCalldataQuery' })
    logger.error(message, {
      tags: { file: 'CreatePositionTxContext', function: 'useEffect' },
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
      protocolVersion,
      approvalCalldata,
      createCalldata,
      createCalldataQueryParams,
      currencyAmounts,
      poolOrPair: protocolVersion === ProtocolVersion.V2 && poolOrPair instanceof Pair ? poolOrPair : undefined,
      canBatchTransactions,
    })
  }, [
    approvalCalldata,
    createCalldata,
    createCalldataQueryParams,
    currencyAmounts,
    poolOrPair,
    protocolVersion,
    canBatchTransactions,
  ])


  const value = useMemo(
    (): CreatePositionTxContextType => ({
      txInfo,
      gasFeeEstimateUSD: totalGasFee,
      transactionError,
      setTransactionError,
      dependentAmount:
        createError && dependentAmountFallback ? dependentAmountFallback : createCalldata?.dependentAmount,
      currencyAmounts,
      inputError,
      formattedAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
    }),
    [
      txInfo,
      totalGasFee,
      transactionError,
      createError,
      dependentAmountFallback,
      createCalldata?.dependentAmount,
      currencyAmounts,
      inputError,
      formattedAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
    ],
  )

  return <CreatePositionTxContext.Provider value={value}>{children}</CreatePositionTxContext.Provider>
}

export const useCreatePositionTxContext = (): CreatePositionTxContextType => {
  const context = useContext(CreatePositionTxContext)

  if (!context) {
    throw new Error('`useCreatePositionTxContext` must be used inside of `CreatePositionTxContextProvider`')
  }

  return context
}
