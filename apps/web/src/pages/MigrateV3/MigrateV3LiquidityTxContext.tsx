// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { V3PositionInfo } from 'components/Liquidity/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useMigrateV3LpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useMigrateV3LpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  MigrateLPPositionRequest,
  ProtocolItems,
} from 'uniswap/src/data/tradingApi/__generated__'
import { MigrateV3PositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { validatePermit, validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAccount } from 'wagmi'

interface MigrateV3PositionTxContextType {
  txInfo?: MigrateV3PositionTxAndGasInfo
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
}

const MigrateV3PositionTxContext = createContext<MigrateV3PositionTxContextType | undefined>(undefined)

export function useMigrateV3TxContext() {
  const context = useContext(MigrateV3PositionTxContext)
  if (!context) {
    throw new Error('useMigrateV3TxContext must be used within a MigrateV3PositionTxContextProvider')
  }
  return context
}

export function MigrateV3PositionTxContextProvider({
  children,
  positionInfo,
}: PropsWithChildren<{ positionInfo: V3PositionInfo }>): JSX.Element {
  const account = useAccount()

  const { derivedPositionInfo, positionState } = useCreatePositionContext()
  const { feeValue0, feeValue1 } = useV3OrV4PositionDerivedInfo(positionInfo)
  const {
    derivedPriceRangeInfo,
    priceRangeState: { fullRange },
  } = usePriceRangeContext()

  const increaseLiquidityApprovalParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !account.address) {
      return undefined
    }
    return {
      simulateTransaction: true,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      protocol: ProtocolItems.V3,
      positionToken: positionInfo.tokenId,
    }
  }, [positionInfo, account.address])

  const { data: migrateTokenApprovals } = useCheckLpApprovalQuery({
    params: increaseLiquidityApprovalParams,
    headers: {
      'x-universal-router-version': '2.0',
    },
    staleTime: 5 * ONE_SECOND_MS,
  })

  const migratePositionRequestArgs: MigrateLPPositionRequest | undefined = useMemo(() => {
    if (
      !derivedPositionInfo ||
      !positionInfo ||
      !positionInfo.tokenId ||
      !account?.address ||
      !derivedPriceRangeInfo ||
      derivedPositionInfo.protocolVersion !== ProtocolVersion.V4 ||
      derivedPriceRangeInfo.protocolVersion !== ProtocolVersion.V4 ||
      !positionInfo.pool ||
      !positionInfo.liquidity
    ) {
      return undefined
    }
    const destinationPool = derivedPositionInfo.pool ?? derivedPriceRangeInfo.mockPool
    if (!destinationPool) {
      return undefined
    }
    const tickLower = fullRange ? derivedPriceRangeInfo.tickSpaceLimits[0] : derivedPriceRangeInfo.ticks?.[0]
    const tickUpper = fullRange ? derivedPriceRangeInfo.tickSpaceLimits[1] : derivedPriceRangeInfo.ticks?.[1]

    if (!tickLower || !tickUpper || !positionInfo.pool || !positionInfo.liquidity) {
      return undefined
    }
    return {
      inputProtocol: ProtocolItems.V3,
      tokenId: Number(positionInfo.tokenId),
      inputPosition: {
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
        },
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
      },
      inputPoolLiquidity: positionInfo.pool.liquidity.toString(),
      inputCurrentTick: positionInfo.pool.tickCurrent,
      inputSqrtRatioX96: positionInfo.pool.sqrtRatioX96?.toString(),
      inputPositionLiquidity: positionInfo.liquidity,

      outputProtocol: ProtocolItems.V4,
      outputPosition: {
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionState.fee.feeAmount,
          hooks: positionState.hook,
          tickSpacing: destinationPool.tickSpacing,
        },
        tickLower,
        tickUpper,
      },
      outputPoolLiquidity: derivedPositionInfo.creatingPoolOrPair ? undefined : destinationPool.liquidity.toString(),
      outputSqrtRatioX96: derivedPositionInfo.creatingPoolOrPair ? undefined : destinationPool.sqrtRatioX96.toString(),
      outputCurrentTick: derivedPositionInfo.creatingPoolOrPair ? undefined : destinationPool.tickCurrent,

      initialPrice: derivedPositionInfo.creatingPoolOrPair ? destinationPool.sqrtRatioX96.toString() : undefined,

      chainId: positionInfo.currency0Amount.currency.chainId,
      walletAddress: account.address,
      expectedTokenOwed0RawAmount: feeValue0?.quotient.toString() ?? '0',
      expectedTokenOwed1RawAmount: feeValue1?.quotient.toString() ?? '0',
      amount0: positionInfo.currency0Amount.quotient.toString(),
      amount1: positionInfo.currency1Amount.quotient.toString(),
    }
  }, [
    derivedPositionInfo,
    positionInfo,
    account,
    derivedPriceRangeInfo,
    fullRange,
    positionState.fee.feeAmount,
    positionState.hook,
    feeValue0?.quotient,
    feeValue1?.quotient,
  ])

  const { data: migrateCalldata } = useMigrateV3LpPositionCalldataQuery({
    params: migratePositionRequestArgs,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const validatedValue: MigrateV3PositionTxAndGasInfo | undefined = useMemo(() => {
    if (!migrateCalldata) {
      return undefined
    }

    const validatedPermitRequest = validatePermit(migrateTokenApprovals?.permitData)
    if (migrateTokenApprovals?.permitData && !validatedPermitRequest) {
      return undefined
    }

    const txRequest = validateTransactionRequest(migrateCalldata.migrate)
    if (!txRequest) {
      return undefined
    }

    return {
      type: 'migrate',
      unsigned: Boolean(migrateTokenApprovals?.permitData),
      migratePositionRequestArgs,
      approveToken0Request: undefined,
      approveToken1Request: undefined,
      permit: validatedPermitRequest,
      protocolVersion: ProtocolVersion.V3,
      approvePositionTokenRequest: undefined,
      revocationTxRequest: undefined,
      txRequest,
      action: {
        currency0Amount: positionInfo.currency0Amount,
        currency1Amount: positionInfo.currency1Amount,
      },
    }
  }, [
    migrateCalldata,
    migratePositionRequestArgs,
    migrateTokenApprovals,
    positionInfo.currency0Amount,
    positionInfo.currency1Amount,
  ])

  return (
    <MigrateV3PositionTxContext.Provider value={{ txInfo: validatedValue }}>
      {children}
    </MigrateV3PositionTxContext.Provider>
  )
}
