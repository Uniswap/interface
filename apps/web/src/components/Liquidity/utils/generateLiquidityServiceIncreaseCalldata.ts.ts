import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { IncreaseLPPositionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  IndependentToken,
  Protocols,
  V2IncreaseLPPosition,
  V3IncreaseLPPosition,
  V3Pool,
  V3Position,
  V4IncreaseLPPosition,
  V4Pool,
  V4Position,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { PositionInfo } from '~/components/Liquidity/types'
import { getTokenOrZeroAddress } from '~/components/Liquidity/utils/currency'
import { PositionField } from '~/types/position'

export function generateLiquidityServiceIncreaseCalldataParams({
  token0,
  token1,
  exactField,
  token0Amount,
  token1Amount,
  approvalsNeeded,
  positionInfo,
  accountAddress,
  customSlippageTolerance,
  customDeadline,
}: {
  token0: Currency
  token1: Currency
  exactField: PositionField
  token0Amount: string
  token1Amount: string
  approvalsNeeded: boolean
  positionInfo: PositionInfo
  accountAddress: string
  customSlippageTolerance?: number
  customDeadline?: number
}): IncreaseLPPositionRequest | undefined {
  const deadline = getTradeSettingsDeadline(customDeadline)
  const chainId = positionInfo.currency0Amount.currency.chainId

  const [independentAmount, dependentAmount] =
    exactField === PositionField.TOKEN0 ? [token0Amount, token1Amount] : [token1Amount, token0Amount]
  const independentToken = exactField === PositionField.TOKEN0 ? IndependentToken.TOKEN_0 : IndependentToken.TOKEN_1

  if (positionInfo.version === ProtocolVersion.V2) {
    return new IncreaseLPPositionRequest({
      increaseLpPosition: {
        case: 'v2IncreaseLpPosition',
        value: new V2IncreaseLPPosition({
          simulateTransaction: !approvalsNeeded,
          protocols: Protocols.V2,
          walletAddress: accountAddress,
          chainId,
          independentAmount,
          independentToken,
          defaultDependentAmount: dependentAmount,
          slippageTolerance: customSlippageTolerance,
          deadline,
          position: {
            pool: {
              token0: getTokenOrZeroAddress(token0),
              token1: getTokenOrZeroAddress(token1),
            },
          },
        }),
      },
    })
  }

  if (positionInfo.version === ProtocolVersion.V3) {
    return new IncreaseLPPositionRequest({
      increaseLpPosition: {
        case: 'v3IncreaseLpPosition',
        value: new V3IncreaseLPPosition({
          protocols: Protocols.V3,
          tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
          position: new V3Position({
            tickLower: positionInfo.tickLower,
            tickUpper: positionInfo.tickUpper,
            pool: new V3Pool({
              token0: getTokenOrZeroAddress(token0),
              token1: getTokenOrZeroAddress(token1),
              fee: positionInfo.feeTier?.feeAmount,
              tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
            }),
          }),
          walletAddress: accountAddress,
          chainId,
          independentAmount,
          independentToken,
          slippageTolerance: customSlippageTolerance,
          deadline,
          simulateTransaction: !approvalsNeeded,
        }),
      },
    })
  }

  // V4 is the only remaining case after V2 and V3
  return new IncreaseLPPositionRequest({
    increaseLpPosition: {
      case: 'v4IncreaseLpPosition',
      value: new V4IncreaseLPPosition({
        protocols: Protocols.V4,
        tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
        walletAddress: accountAddress,
        chainId,
        independentAmount,
        independentToken,
        slippageTolerance: customSlippageTolerance,
        deadline,
        simulateTransaction: !approvalsNeeded,
        position: new V4Position({
          tickLower: positionInfo.tickLower,
          tickUpper: positionInfo.tickUpper,
          pool: new V4Pool({
            token0: getTokenOrZeroAddress(token0),
            token1: getTokenOrZeroAddress(token1),
            fee: positionInfo.feeTier?.feeAmount,
            tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
            hooks: positionInfo.v4hook,
          }),
        }),
      }),
    },
  })
}
