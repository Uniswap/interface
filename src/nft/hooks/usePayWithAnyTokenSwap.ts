import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { PermitInput, TokenTradeRoutesInput, TokenTradeType } from 'graphql/data/__generated__/types-and-hooks'
import { Allowance } from 'hooks/usePermit2Allowance'
import { buildAllTradeRouteInputs } from 'nft/utils/tokenRoutes'
import { useEffect } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { useTokenInput } from './useTokenInput'

export default function usePayWithAnyTokenSwap(
  trade?: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  allowance?: Allowance,
  allowedSlippage?: Percent
) {
  const setTokenTradeInput = useTokenInput((state) => state.setTokenTradeInput)
  const hasRoutes = !!trade && trade.routes
  const hasInputAmount = !!trade && !!trade.inputAmount && trade.inputAmount.currency.isToken
  const hasAllowance = !!allowedSlippage && !!allowance

  useEffect(() => {
    if (!hasRoutes || !hasInputAmount || !hasAllowance) {
      setTokenTradeInput(undefined)
      return
    }

    const slippage = parseInt(allowedSlippage.multiply(100).toSignificant(2))

    const { mixedTokenTradeRouteInputs, v2TokenTradeRouteInputs, v3TokenTradeRouteInputs } =
      buildAllTradeRouteInputs(trade)

    const routes: TokenTradeRoutesInput = {
      mixedRoutes: mixedTokenTradeRouteInputs,
      tradeType: TokenTradeType.ExactOutput,
      v2Routes: v2TokenTradeRouteInputs,
      v3Routes: v3TokenTradeRouteInputs,
    }

    const permitInput: PermitInput | undefined =
      'permitSignature' in allowance && allowance.permitSignature
        ? {
            details: {
              amount: allowance.permitSignature.details.amount.toString(),
              expiration: allowance.permitSignature.details.expiration.toString(),
              nonce: allowance.permitSignature.details.nonce.toString(),
              token: allowance.permitSignature.details.token,
            },
            sigDeadline: allowance.permitSignature.sigDeadline.toString(),
            signature: allowance.permitSignature.signature,
            spender: allowance.permitSignature.spender,
          }
        : undefined

    setTokenTradeInput({
      permit: permitInput,
      routes,
      slippageToleranceBasisPoints: slippage,
      tokenAmount: {
        amount: trade.inputAmount.quotient.toString(),
        token: {
          address: trade.inputAmount.currency.address,
          chainId: trade.inputAmount.currency.chainId,
          decimals: trade.inputAmount.currency.decimals,
          isNative: trade.inputAmount.currency.isNative,
        },
      },
    })
  }, [allowance, allowedSlippage, hasAllowance, hasInputAmount, hasRoutes, setTokenTradeInput, trade])
}
