import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
import { getProtocolItems } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import {
  CreatePositionContext,
  DEFAULT_PRICE_RANGE_STATE,
  PriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { useDerivedPositionInfo, useDerivedPriceRangeInfo } from 'pages/Pool/Positions/create/hooks'
import {
  DEFAULT_POSITION_STATE,
  PositionFlowStep,
  PositionState,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import { useMemo, useState } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useCreateLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useCreateLpPositionCalldataQuery'
import { CheckApprovalLPRequest, CreateLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAccount } from 'wagmi'

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
  const account = useAccount()

  const addLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
    if (!derivedPositionInfo.pool || !account.address || !apiProtocolItems) {
      return undefined
    }
    return {
      walletAddress: account.address,
      chainId: positionState.currencyInputs.TOKEN0?.chainId,
      protocol: apiProtocolItems,
      token0: positionState.currencyInputs.TOKEN0?.isNative
        ? ZERO_ADDRESS
        : positionState.currencyInputs.TOKEN0?.address,
      token1: positionState.currencyInputs.TOKEN1?.isNative
        ? ZERO_ADDRESS
        : positionState.currencyInputs.TOKEN1?.address,
      // todo: get these from input state
      // amount0: positionInfo.currency0Amount.quotient.toString(),
      // amount1: positionInfo.currency1Amount.quotient.toString(),
    }
  }, [
    account.address,
    derivedPositionInfo.pool,
    positionState.currencyInputs.TOKEN0,
    positionState.currencyInputs.TOKEN1,
    positionState.protocolVersion,
  ])
  const { data: addLiquidityTokenApprovals, isLoading: approvalLoading } = useCheckLpApprovalQuery({
    params: addLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const createCalldataQueryParams: CreateLPPositionRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionState.protocolVersion)
    if (
      !account.address ||
      !apiProtocolItems ||
      !positionState.currencyInputs.TOKEN0 ||
      !positionState.currencyInputs.TOKEN1
    ) {
      return undefined
    }
    const needsApproval = Boolean(
      addLiquidityTokenApprovals?.token0Approval || addLiquidityTokenApprovals?.token1Approval,
    )
    // todo: don't skip this query, we actually want to load both to get gas estimates early
    if (needsApproval || !addLiquidityApprovalParams || approvalLoading) {
      return undefined
    }
    return {
      protocol: apiProtocolItems,
      walletAddress: account.address,
      chainId: positionState.currencyInputs.TOKEN0?.chainId,
      // todo: get these from input state
      // amount0: derivedAddLiquidityInfo.currencyAmounts?.TOKEN0?.quotient.toString(),
      // amount1: derivedAddLiquidityInfo.currencyAmounts?.TOKEN1?.quotient.toString(),
      poolLiquidity: derivedPositionInfo.pool?.liquidity.toString(),
      currentTick: derivedPositionInfo.pool?.tickCurrent,
      sqrtRatioX96: derivedPositionInfo.pool?.sqrtRatioX96.toString(),
      // todo: set the initial price if the pool doesn't already exist
      // initialPrice: derivedPositionInfo.pool ? undefined : 100
      position: {
        // todo: get these from input state
        // tickLower: Number(positionInfo.tickLower),
        // tickUpper: Number(positionInfo.tickUpper),
        // tickSpacing: Number(positionInfo.tickSpacing),
        pool: {
          token0: positionState.currencyInputs.TOKEN0.isNative
            ? ZERO_ADDRESS
            : positionState.currencyInputs.TOKEN0.address,
          token1: positionState.currencyInputs.TOKEN1.isNative
            ? ZERO_ADDRESS
            : positionState.currencyInputs.TOKEN1.address,
          fee: positionState.fee,
          hooks: positionState.hook,
        },
      },
    }
  }, [
    addLiquidityApprovalParams,
    addLiquidityTokenApprovals,
    approvalLoading,
    account,
    positionState,
    derivedPositionInfo.pool,
  ])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: createCalldata } = useCreateLpPositionCalldataQuery({
    params: createCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

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
