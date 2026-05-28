import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { LPApprovalRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPAction, LPToken } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { getTokenOrZeroAddress, validateCurrencyInput } from '~/features/Liquidity/utils/currency'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'
import { PositionField } from '~/types/position'

export function getCheckLPApprovalRequestParams({
  walletAddress,
  protocolVersion,
  currencyAmounts,
  canBatchTransactions,
  action,
}: {
  walletAddress?: string
  protocolVersion?: ProtocolVersion
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  canBatchTransactions?: boolean
  action: LPAction
}): LPApprovalRequest | undefined {
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

  return new LPApprovalRequest({
    walletAddress,
    chainId: currencyAmounts.TOKEN0.currency.chainId,
    protocol,
    lpTokens: [
      new LPToken({
        tokenAddress: getTokenOrZeroAddress(currencyAmounts.TOKEN0.currency),
        amount: currencyAmounts.TOKEN0.quotient.toString(),
      }),
      new LPToken({
        tokenAddress: getTokenOrZeroAddress(currencyAmounts.TOKEN1.currency),
        amount: currencyAmounts.TOKEN1.quotient.toString(),
      }),
    ],
    action,
    simulateTransaction: true,
    generatePermitAsTransaction: canBatchTransactions ?? false,
  })
}
