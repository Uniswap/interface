import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CheckApprovalLPRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  Protocols,
  V2CheckApprovalLPRequest,
  V3CheckApprovalLPRequest,
  V4CheckApprovalLPRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { getTokenOrZeroAddress, validateCurrencyInput } from '~/components/Liquidity/utils/currency'
import { getProtocols } from '~/components/Liquidity/utils/protocolVersion'
import { PositionField } from '~/types/position'

export function getCheckLPApprovalRequestParams({
  walletAddress,
  protocolVersion,
  currencyAmounts,
  canBatchTransactions,
}: {
  walletAddress?: string
  protocolVersion?: ProtocolVersion
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  canBatchTransactions?: boolean
}): CheckApprovalLPRequest | undefined {
  const protocol = getProtocols(protocolVersion)

  if (
    !walletAddress ||
    protocol === undefined ||
    !currencyAmounts?.TOKEN0 ||
    !currencyAmounts.TOKEN1 ||
    !validateCurrencyInput({ TOKEN0: currencyAmounts.TOKEN0.currency, TOKEN1: currencyAmounts.TOKEN1.currency })
  ) {
    return undefined
  }

  const token0 = getTokenOrZeroAddress(currencyAmounts.TOKEN0.currency)
  const token1 = getTokenOrZeroAddress(currencyAmounts.TOKEN1.currency)
  const chainId = currencyAmounts.TOKEN0.currency.chainId
  const amount0 = currencyAmounts.TOKEN0.quotient.toString()
  const amount1 = currencyAmounts.TOKEN1.quotient.toString()

  switch (protocol) {
    case Protocols.V2:
      return new CheckApprovalLPRequest({
        checkApprovalLPRequest: {
          case: 'v2CheckApprovalLpRequest',
          value: new V2CheckApprovalLPRequest({
            protocol: getProtocols(ProtocolVersion.V2),
            token0,
            token1,
            chainId,
            walletAddress,
            amount0,
            amount1,
            simulateTransaction: true,
          }),
        },
      })

    case Protocols.V3:
      return new CheckApprovalLPRequest({
        checkApprovalLPRequest: {
          case: 'v3CheckApprovalLpRequest',
          value: new V3CheckApprovalLPRequest({
            protocol: getProtocols(ProtocolVersion.V3),
            token0,
            token1,
            chainId,
            walletAddress,
            amount0,
            amount1,
            simulateTransaction: true,
          }),
        },
      })

    case Protocols.V4:
      return new CheckApprovalLPRequest({
        checkApprovalLPRequest: {
          case: 'v4CheckApprovalLpRequest',
          value: new V4CheckApprovalLPRequest({
            protocol,
            token0,
            token1,
            chainId,
            walletAddress,
            amount0,
            amount1,
            generatePermitAsTransaction: canBatchTransactions ?? false,
            simulateTransaction: true,
          }),
        },
      })
    default:
      return undefined
  }
}
