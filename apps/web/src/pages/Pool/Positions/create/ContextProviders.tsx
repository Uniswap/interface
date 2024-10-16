import { BigNumber } from '@ethersproject/bignumber'
import { useQuery } from '@tanstack/react-query'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
import { DepositState } from 'components/Liquidity/types'
import { getProtocolItems } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import {
  CreatePositionContext,
  CreateTxContext,
  DEFAULT_DEPOSIT_STATE,
  DEFAULT_PRICE_RANGE_STATE,
  DepositContext,
  PriceRangeContext,
  useCreatePositionContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import {
  useDerivedDepositInfo,
  useDerivedPositionInfo,
  useDerivedPriceRangeInfo,
} from 'pages/Pool/Positions/create/hooks'
import {
  DEFAULT_POSITION_STATE,
  PositionFlowStep,
  PositionState,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import { useMemo, useState } from 'react'
import { useProvider } from 'uniswap/src/contexts/UniswapContext'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { CheckApprovalLPRequest, CreateLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { CreatePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { getWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/hooks/useWrapTransactionRequest'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function CreatePositionContextProvider({
  children,
  initialState = {},
}: {
  children: React.ReactNode
  initialState?: Partial<PositionState>
}) {
  const [positionState, setPositionState] = useState<PositionState>({ ...DEFAULT_POSITION_STATE, ...initialState })
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  const derivedPositionInfo = useDerivedPositionInfo(positionState)
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)

  return (
    <CreatePositionContext.Provider
      value={{
        step,
        setStep,
        positionState,
        setPositionState,
        derivedPositionInfo,
        feeTierSearchModalOpen,
        setFeeTierSearchModalOpen,
      }}
    >
      {children}
      <FeeTierSearchModal />
    </CreatePositionContext.Provider>
  )
}

export function PriceRangeContextProvider({ children }: { children: React.ReactNode }) {
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>(DEFAULT_PRICE_RANGE_STATE)
  const derivedPriceRangeInfo = useDerivedPriceRangeInfo(priceRangeState)

  return (
    <PriceRangeContext.Provider value={{ priceRangeState, setPriceRangeState, derivedPriceRangeInfo }}>
      {children}
    </PriceRangeContext.Provider>
  )
}

export function DepositContextProvider({ children }: { children: React.ReactNode }) {
  const [depositState, setDepositState] = useState<DepositState>(DEFAULT_DEPOSIT_STATE)
  const derivedDepositInfo = useDerivedDepositInfo(depositState)

  return (
    <DepositContext.Provider value={{ depositState, setDepositState, derivedDepositInfo }}>
      {children}
    </DepositContext.Provider>
  )
}

export function CreateTxContextProvider({ children }: { children: React.ReactNode }) {
  const account = useAccount()
  const provider = useProvider(account.chainId ?? UniverseChainId.Mainnet)
  const {
    priceRangeState: { fullRange },
    derivedPriceRangeInfo: { tickSpaceLimits, ticks },
  } = usePriceRangeContext()

  const {
    derivedDepositInfo: { currencyAmounts },
  } = useDepositContext()

  const { derivedPositionInfo, positionState } = useCreatePositionContext()

  const selectedNativeCurrencyAmount = useMemo(() => {
    const selectedNativeCurrency = positionState.currencyInputs.TOKEN0?.isNative
      ? positionState.currencyInputs.TOKEN0
      : positionState.currencyInputs.TOKEN1?.isNative
        ? positionState.currencyInputs.TOKEN1
        : undefined
    if (!selectedNativeCurrency) {
      return undefined
    }
    if (currencyAmounts?.TOKEN0?.currency.equals(selectedNativeCurrency.wrapped)) {
      return CurrencyAmount.fromFractionalAmount(
        selectedNativeCurrency,
        currencyAmounts.TOKEN0.numerator,
        currencyAmounts.TOKEN0.denominator,
      )
    } else if (currencyAmounts?.TOKEN1?.currency.equals(selectedNativeCurrency.wrapped)) {
      return CurrencyAmount.fromFractionalAmount(
        selectedNativeCurrency,
        currencyAmounts.TOKEN1.numerator,
        currencyAmounts.TOKEN1.denominator,
      )
    }
    return undefined
  }, [currencyAmounts, positionState.currencyInputs])

  const [wrappedNativeBalance] = useCurrencyBalances(
    account.address,
    [selectedNativeCurrencyAmount?.currency?.wrapped].filter(Boolean),
  )

  const { data: wrapTxRequest } = useQuery({
    queryKey: ['CreateTxContextProvider-wrapTxRequest', derivedPositionInfo, account.address],
    queryFn: async () => {
      const txRequest = await getWrapTransactionRequest(
        provider,
        false,
        account.chainId ?? UniverseChainId.Mainnet,
        account.address,
        WrapType.Wrap,
        selectedNativeCurrencyAmount,
      )
      return {
        ...txRequest,
        value: BigNumber.from(txRequest?.value)?.toString(),
      }
    },
    enabled: Boolean(
      positionState.protocolVersion !== ProtocolVersion.V4 &&
        account.address &&
        selectedNativeCurrencyAmount &&
        wrappedNativeBalance?.greaterThan(selectedNativeCurrencyAmount),
    ),
  })

  const addLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
    if (!account.address || !apiProtocolItems || !currencyAmounts?.TOKEN0 || !currencyAmounts?.TOKEN1) {
      return undefined
    }
    return {
      walletAddress: account.address,
      chainId: derivedPositionInfo.currencies.TOKEN0?.chainId,
      protocol: apiProtocolItems,
      token0:
        derivedPositionInfo.currencies.TOKEN0?.isNative && positionState.protocolVersion === ProtocolVersion.V4
          ? ZERO_ADDRESS
          : derivedPositionInfo.currencies.TOKEN0?.wrapped.address,
      token1:
        derivedPositionInfo.currencies.TOKEN1?.isNative && positionState.protocolVersion === ProtocolVersion.V4
          ? ZERO_ADDRESS
          : derivedPositionInfo.currencies.TOKEN1?.wrapped.address,
      amount0: currencyAmounts?.TOKEN0?.quotient.toString(),
      amount1: currencyAmounts?.TOKEN1?.quotient.toString(),
    }
  }, [account.address, positionState.protocolVersion, derivedPositionInfo.currencies, currencyAmounts])
  const { data: approvalCalldata } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const createCalldataQueryParams: CreateLPPositionRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
    const tickLower = fullRange ? tickSpaceLimits[0] : ticks?.[0]
    const tickUpper = fullRange ? tickSpaceLimits[1] : ticks?.[1]
    if (
      !account.address ||
      !apiProtocolItems ||
      !derivedPositionInfo.currencies.TOKEN0 ||
      !derivedPositionInfo.currencies.TOKEN1 ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts?.TOKEN1 ||
      !tickLower ||
      !tickUpper
    ) {
      return undefined
    }
    let poolLiquidity: string | undefined
    let currentTick: number | undefined
    let sqrtRatioX96: string | undefined
    let tickSpacing: number | undefined
    if (
      derivedPositionInfo.protocolVersion === ProtocolVersion.V3 ||
      derivedPositionInfo.protocolVersion === ProtocolVersion.V4
    ) {
      if (!derivedPositionInfo.pool) {
        return undefined
      } else {
        poolLiquidity = derivedPositionInfo.pool.liquidity.toString()
        currentTick = derivedPositionInfo.pool.tickCurrent
        sqrtRatioX96 = derivedPositionInfo.pool.sqrtRatioX96.toString()
        tickSpacing = derivedPositionInfo.pool.tickSpacing
      }
    }
    if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2 && !derivedPositionInfo.pair) {
      return undefined
    }
    const { token0Approval, token1Approval, positionTokenApproval, permitData } = approvalCalldata ?? {}
    const needsWrap = Boolean(
      derivedPositionInfo.protocolVersion !== ProtocolVersion.V4 && selectedNativeCurrencyAmount,
    )
    return {
      simulateTransaction: !(permitData || token0Approval || token1Approval || positionTokenApproval || needsWrap),
      protocol: apiProtocolItems,
      walletAddress: account.address,
      chainId: derivedPositionInfo.currencies.TOKEN0?.chainId,
      amount0: currencyAmounts?.TOKEN0?.quotient.toString(),
      amount1: currencyAmounts?.TOKEN1?.quotient.toString(),
      poolLiquidity,
      currentTick,
      sqrtRatioX96,
      // todo: set the initial price if the pool doesn't already exist
      // initialPrice: derivedPositionInfo.pool ? undefined : 100
      position: {
        tickLower,
        tickUpper,
        pool: {
          tickSpacing,
          token0:
            derivedPositionInfo.currencies.TOKEN0?.isNative && positionState.protocolVersion === ProtocolVersion.V4
              ? ZERO_ADDRESS
              : derivedPositionInfo.currencies.TOKEN0?.wrapped.address,
          token1:
            derivedPositionInfo.currencies.TOKEN1?.isNative && positionState.protocolVersion === ProtocolVersion.V4
              ? ZERO_ADDRESS
              : derivedPositionInfo.currencies.TOKEN1?.wrapped.address,
          fee: positionState.fee,
          hooks: positionState.hook,
        },
      },
    }
  }, [
    account,
    positionState,
    derivedPositionInfo,
    currencyAmounts,
    fullRange,
    ticks,
    tickSpaceLimits,
    approvalCalldata,
    selectedNativeCurrencyAmount,
  ])

  const { data: createCalldata } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const validatedValue = useMemo(() => {
    if (!createCalldata || !currencyAmounts?.TOKEN0 || !currencyAmounts?.TOKEN1) {
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

    const validatedPermitRequest = validatePermit(approvalCalldata?.permitData)
    if (approvalCalldata?.permitData && !validatedPermitRequest) {
      return undefined
    }

    const validatedWrapRequest = validateTransactionRequest(wrapTxRequest)
    if (wrapTxRequest && !validatedWrapRequest) {
      return undefined
    }

    const txRequest = validateTransactionRequest(createCalldata.create)
    if (!txRequest) {
      return undefined
    }

    return {
      type: 'create',
      unsigned: Boolean(approvalCalldata?.permitData),
      protocolVersion: derivedPositionInfo.protocolVersion,
      createPositionRequestArgs: createCalldataQueryParams,
      action: {
        nativeCurrencyAmount: selectedNativeCurrencyAmount,
        currency0Amount: currencyAmounts.TOKEN0,
        currency1Amount: currencyAmounts.TOKEN1,
        liquidityToken:
          derivedPositionInfo.protocolVersion === ProtocolVersion.V2
            ? derivedPositionInfo.pair?.liquidityToken
            : undefined,
      },
      wrapTxRequest: validatedWrapRequest,
      approveToken0Request: validatedApprove0Request,
      approveToken1Request: validatedApprove1Request,
      txRequest,
      approvePositionTokenRequest: undefined,
      revocationTxRequest: undefined,
      permit: validatedPermitRequest,
    } satisfies CreatePositionTxAndGasInfo
  }, [
    approvalCalldata,
    createCalldata,
    createCalldataQueryParams,
    derivedPositionInfo,
    currencyAmounts,
    wrapTxRequest,
    selectedNativeCurrencyAmount,
  ])

  return <CreateTxContext.Provider value={validatedValue}>{children}</CreateTxContext.Provider>
}
