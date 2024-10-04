import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useDerivedIncreaseLiquidityInfo } from 'components/IncreaseLiquidity/hooks'
import { PositionInfo, getProtocolItems, useModalLiquidityPositionInfo } from 'components/Liquidity/utils'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePool } from 'pages/Pool/Positions/create/hooks'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import { PositionField } from 'types/position'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useIncreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useIncreaseLpPositionCalldataQuery'
import { CheckApprovalLPRequest, IncreaseLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAccount } from 'wagmi'

export enum IncreaseLiquidityStep {
  Input,
  Review,
}

export interface IncreaseLiquidityState {
  position?: PositionInfo
  exactField: PositionField
  exactAmount?: string
}
const DEFAULT_INCREASE_LIQUIDITY_STATE = {
  step: IncreaseLiquidityStep.Input,
  exactField: PositionField.TOKEN0,
}

export interface IncreaseLiquidityInfo {
  formattedAmounts?: { [field in PositionField]?: string }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmounts?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmountsUSDValue?: { [field in PositionField]?: CurrencyAmount<Currency> }
}

interface IncreaseLiquidityContextType {
  step: IncreaseLiquidityStep
  setStep: Dispatch<SetStateAction<IncreaseLiquidityStep>>
  increaseLiquidityState: IncreaseLiquidityState
  derivedIncreaseLiquidityInfo: IncreaseLiquidityInfo
  setIncreaseLiquidityState: Dispatch<SetStateAction<IncreaseLiquidityState>>
}

const IncreaseLiquidityContext = createContext<IncreaseLiquidityContextType>({
  step: IncreaseLiquidityStep.Input,
  setStep: () => undefined,
  increaseLiquidityState: DEFAULT_INCREASE_LIQUIDITY_STATE,
  derivedIncreaseLiquidityInfo: {},
  setIncreaseLiquidityState: () => undefined,
})

export function useIncreaseLiquidityContext() {
  return useContext(IncreaseLiquidityContext)
}

export function IncreaseLiquidityContextProvider({ children }: PropsWithChildren) {
  const positionInfo = useModalLiquidityPositionInfo()

  const [step, setStep] = useState(IncreaseLiquidityStep.Input)

  const [increaseLiquidityState, setIncreaseLiquidityState] = useState<IncreaseLiquidityState>({
    ...DEFAULT_INCREASE_LIQUIDITY_STATE,
    position: positionInfo,
  })

  const derivedIncreaseLiquidityInfo = useDerivedIncreaseLiquidityInfo(increaseLiquidityState)
  const pool = usePool(
    positionInfo?.currency0Amount.currency,
    positionInfo?.currency1Amount.currency,
    positionInfo?.feeTier ? Number(positionInfo.feeTier) : undefined,
    positionInfo?.currency0Amount.currency.chainId ?? UniverseChainId.Mainnet,
    positionInfo?.version,
  )

  const account = useAccount()

  const increaseLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (
      !positionInfo ||
      !account.address ||
      !derivedIncreaseLiquidityInfo.currencyBalances?.TOKEN0 ||
      !derivedIncreaseLiquidityInfo.currencyBalances?.TOKEN1
    ) {
      return undefined
    }
    return {
      simulateTransaction: true,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: getProtocolItems(positionInfo.version),
      token0: positionInfo.currency0Amount.currency.isNative
        ? ZERO_ADDRESS
        : positionInfo.currency0Amount.currency.address,
      token1: positionInfo.currency1Amount.currency.isNative
        ? ZERO_ADDRESS
        : positionInfo.currency1Amount.currency.address,
      amount0: derivedIncreaseLiquidityInfo.currencyBalances?.TOKEN0?.quotient.toString(),
      amount1: derivedIncreaseLiquidityInfo.currencyBalances?.TOKEN1?.quotient.toString(),
    }
  }, [positionInfo, account.address, derivedIncreaseLiquidityInfo])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: increaseLiquidityTokenApprovals, isLoading: approvalLoading } = useCheckLpApprovalQuery({
    params: increaseLiquidityApprovalParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const increaseCalldataQueryParams: IncreaseLPPositionRequest | undefined = useMemo(() => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    const amount0 = derivedIncreaseLiquidityInfo.currencyAmounts?.TOKEN0?.quotient.toString()
    const amount1 = derivedIncreaseLiquidityInfo.currencyAmounts?.TOKEN1?.quotient.toString()
    if (!positionInfo || !account.address || !apiProtocolItems || !amount0 || !amount1) {
      return undefined
    }
    return {
      simulateTransaction: false,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      amount0,
      amount1,
      poolLiquidity: pool?.liquidity,
      currentTick: pool?.tick,
      sqrtRatioX96: pool?.sqrtPriceX96,
      position: {
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
    }
  }, [account, positionInfo, derivedIncreaseLiquidityInfo, pool])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: increaseCalldata } = useIncreaseLpPositionCalldataQuery({
    params: increaseCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const value = useMemo(
    () => ({
      step,
      setStep,
      increaseLiquidityState,
      setIncreaseLiquidityState,
      derivedIncreaseLiquidityInfo,
    }),
    [increaseLiquidityState, derivedIncreaseLiquidityInfo, step],
  )

  return <IncreaseLiquidityContext.Provider value={value}>{children}</IncreaseLiquidityContext.Provider>
}
