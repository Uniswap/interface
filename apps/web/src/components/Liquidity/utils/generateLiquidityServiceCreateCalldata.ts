import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CheckApprovalLPResponse,
  CreateLPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  IndependentToken,
  Protocols,
  V2CreateLPPosition,
  V3CreateLPPosition,
  V4CreateLPPosition,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { DYNAMIC_FEE_DATA, PositionState } from '~/components/Liquidity/Create/types'
import { getTokenOrZeroAddress, validateCurrencyInput } from '~/components/Liquidity/utils/currency'
import { PositionField } from '~/types/position'

interface BaseValidatedInput {
  address: string
  chainId: number
  independentToken: IndependentToken
  independentAmount: string
  dependentAmount: string | undefined
  slippageTolerance: number | undefined
  deadline: number | undefined
  simulateTransaction: boolean
  token0Address: string
  token1Address: string
}

type ValidatedCreateInput =
  | ({ protocol: ProtocolVersion.V2 } & BaseValidatedInput)
  | ({
      protocol: ProtocolVersion.V3
      tickLower: number
      tickUpper: number
      tickSpacing: number
      fee: number
      initialPrice: string | undefined
    } & BaseValidatedInput)
  | ({
      protocol: ProtocolVersion.V4
      tickLower: number
      tickUpper: number
      tickSpacing: number
      fee: number
      hook: string | undefined
      initialPrice: string | undefined
    } & BaseValidatedInput)

interface RawCreatePositionInput {
  protocolVersion: ProtocolVersion
  creatingPoolOrPair: boolean | undefined
  address?: string
  approvalCalldata?: CheckApprovalLPResponse | TradingApi.CheckApprovalLPResponse
  positionState: PositionState
  ticks: [Maybe<number>, Maybe<number>]
  poolOrPair: V3Pool | V4Pool | Pair | undefined
  displayCurrencies: { [field in PositionField]: Maybe<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  independentField: PositionField
  slippageTolerance?: number
  customDeadline?: number
}

function validatePoolInput({
  base,
  protocolVersion,
  positionState,
  ticks,
  poolOrPair,
  creatingPoolOrPair,
}: {
  base: BaseValidatedInput
  protocolVersion: ProtocolVersion.V3 | ProtocolVersion.V4
  positionState: PositionState
  ticks: [Maybe<number>, Maybe<number>]
  poolOrPair: V3Pool | V4Pool | Pair
  creatingPoolOrPair: boolean | undefined
}): ValidatedCreateInput | undefined {
  const pool = poolOrPair as V4Pool | V3Pool
  const tickLower = ticks[0]
  const tickUpper = ticks[1]

  if (tickLower === undefined || tickUpper === undefined) {
    return undefined
  }

  const initialPrice = creatingPoolOrPair ? pool.sqrtRatioX96.toString() : undefined
  const tickSpacing = pool.tickSpacing

  const fee = positionState.fee?.isDynamic ? DYNAMIC_FEE_DATA.feeAmount : positionState.fee?.feeAmount

  if (fee === undefined) {
    return undefined
  }

  if (protocolVersion === ProtocolVersion.V3) {
    return {
      ...base,
      protocol: ProtocolVersion.V3,
      tickLower: tickLower as number,
      tickUpper: tickUpper as number,
      tickSpacing,
      fee,
      initialPrice,
    }
  }

  return {
    ...base,
    protocol: ProtocolVersion.V4,
    tickLower: tickLower as number,
    tickUpper: tickUpper as number,
    tickSpacing,
    fee,
    hook: positionState.hook,
    initialPrice,
  }
}

function validateCreatePositionInput(input: RawCreatePositionInput): ValidatedCreateInput | undefined {
  const {
    protocolVersion,
    creatingPoolOrPair,
    address,
    approvalCalldata,
    positionState,
    ticks,
    poolOrPair,
    displayCurrencies,
    currencyAmounts,
    independentField,
    slippageTolerance,
    customDeadline,
  } = input

  const deadline = getTradeSettingsDeadline(customDeadline)

  if (
    protocolVersion !== positionState.protocolVersion ||
    !address ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput(displayCurrencies) ||
    !poolOrPair ||
    !displayCurrencies.TOKEN0 ||
    !displayCurrencies.TOKEN1
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

  const independentToken =
    independentField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1
  const dependentField = independentField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  const independentAmount = currencyAmounts[independentField]
  const dependentAmount = currencyAmounts[dependentField]

  const simulateTransaction = !(
    permitData ||
    token0PermitTransaction ||
    token1PermitTransaction ||
    token0Approval ||
    token1Approval ||
    positionTokenApproval
  )

  const baseInput: BaseValidatedInput = {
    address,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    independentToken,
    independentAmount: independentAmount?.quotient.toString() ?? '',
    dependentAmount: dependentAmount?.quotient.toString(),
    slippageTolerance,
    deadline,
    simulateTransaction,
    token0Address: getTokenOrZeroAddress(displayCurrencies.TOKEN0),
    token1Address: getTokenOrZeroAddress(displayCurrencies.TOKEN1),
  }

  if (protocolVersion === ProtocolVersion.V2) {
    return {
      ...baseInput,
      protocol: ProtocolVersion.V2,
    }
  }

  if (protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4) {
    return validatePoolInput({
      base: baseInput,
      protocolVersion,
      positionState,
      ticks,
      poolOrPair,
      creatingPoolOrPair,
    })
  }

  return undefined
}

function buildV2CreateRequest(
  input: Extract<ValidatedCreateInput, { protocol: ProtocolVersion.V2 }>,
): CreateLPPositionRequest {
  return new CreateLPPositionRequest({
    createLpPosition: {
      case: 'v2CreateLpPosition',
      value: new V2CreateLPPosition({
        simulateTransaction: input.simulateTransaction,
        protocols: Protocols.V2,
        walletAddress: input.address,
        chainId: input.chainId,
        independentAmount: input.independentAmount,
        independentToken: input.independentToken,
        defaultDependentAmount: input.dependentAmount,
        slippageTolerance: input.slippageTolerance,
        deadline: input.deadline,
        position: { pool: { token0: input.token0Address, token1: input.token1Address } },
      }),
    },
  })
}

function buildV3CreateRequest(
  input: Extract<ValidatedCreateInput, { protocol: ProtocolVersion.V3 }>,
): CreateLPPositionRequest {
  return new CreateLPPositionRequest({
    createLpPosition: {
      case: 'v3CreateLpPosition',
      value: new V3CreateLPPosition({
        simulateTransaction: input.simulateTransaction,
        protocols: Protocols.V3,
        walletAddress: input.address,
        chainId: input.chainId,
        independentAmount: input.independentAmount,
        independentToken: input.independentToken,
        // Only set initialDependentAmount if there is an initialPrice
        initialDependentAmount: input.initialPrice && input.dependentAmount,
        initialPrice: input.initialPrice,
        slippageTolerance: input.slippageTolerance,
        deadline: input.deadline,
        position: {
          tickLower: input.tickLower,
          tickUpper: input.tickUpper,
          pool: {
            tickSpacing: input.tickSpacing,
            token0: input.token0Address,
            token1: input.token1Address,
            fee: input.fee,
          },
        },
      }),
    },
  })
}

function buildV4CreateRequest(
  input: Extract<ValidatedCreateInput, { protocol: ProtocolVersion.V4 }>,
): CreateLPPositionRequest {
  return new CreateLPPositionRequest({
    createLpPosition: {
      case: 'v4CreateLpPosition',
      value: new V4CreateLPPosition({
        simulateTransaction: input.simulateTransaction,
        protocols: Protocols.V4,
        walletAddress: input.address,
        chainId: input.chainId,
        independentAmount: input.independentAmount,
        independentToken: input.independentToken,
        // Only set initialDependentAmount if there is an initialPrice
        initialDependentAmount: input.initialPrice && input.dependentAmount,
        initialPrice: input.initialPrice,
        slippageTolerance: input.slippageTolerance,
        deadline: input.deadline,
        position: {
          tickLower: input.tickLower,
          tickUpper: input.tickUpper,
          pool: {
            tickSpacing: input.tickSpacing,
            token0: input.token0Address,
            token1: input.token1Address,
            fee: input.fee,
            hooks: input.hook,
          },
        },
      }),
    },
  })
}

export function generateLiquidityServiceCreateCalldataQueryParams({
  protocolVersion,
  creatingPoolOrPair,
  address,
  approvalCalldata,
  positionState,
  ticks,
  poolOrPair,
  displayCurrencies,
  currencyAmounts,
  independentField,
  slippageTolerance,
  customDeadline,
}: RawCreatePositionInput): CreateLPPositionRequest | undefined {
  const validated = validateCreatePositionInput({
    protocolVersion,
    creatingPoolOrPair,
    address,
    approvalCalldata,
    positionState,
    ticks,
    poolOrPair,
    displayCurrencies,
    currencyAmounts,
    independentField,
    slippageTolerance,
    customDeadline,
  })

  if (!validated) {
    return undefined
  }

  switch (validated.protocol) {
    case ProtocolVersion.V2:
      return buildV2CreateRequest(validated)
    case ProtocolVersion.V3:
      return buildV3CreateRequest(validated)
    case ProtocolVersion.V4:
      return buildV4CreateRequest(validated)
    default:
      return undefined
  }
}
