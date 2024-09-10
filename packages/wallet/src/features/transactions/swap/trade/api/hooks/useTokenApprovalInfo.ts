import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useRestQuery } from 'uniswap/src/data/rest'
import { ApprovalRequest, ApprovalResponse, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { TradingApiApolloClient } from 'uniswap/src/data/tradingApi/client'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

interface TokenApprovalInfoParams {
  chainId: WalletChainId
  wrapType: WrapType
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  routing: Routing | undefined
  account?: AccountMeta
  skip?: boolean
}

export function useTokenApprovalInfo(
  params: TokenApprovalInfoParams,
): (TokenApprovalInfo & { gasFee?: string }) | undefined {
  const { account, chainId, wrapType, currencyInAmount, routing, skip } = params

  const isWrap = wrapType !== WrapType.NotApplicable

  const address = account?.address
  // Off-chain orders must have wrapped currencies approved, rather than natives.
  const currencyIn = routing === Routing.DUTCH_V2 ? currencyInAmount?.currency.wrapped : currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenAddress = getTokenAddressForApi(currencyIn)

  const approvalRequestArgs: ApprovalRequest | undefined = useMemo(() => {
    const supportedChainId = toTradingApiSupportedChainId(chainId)

    if (!address || !amount || !currencyIn || !tokenAddress || !supportedChainId) {
      return undefined
    }
    return {
      walletAddress: address,
      token: tokenAddress,
      amount,
      chainId: supportedChainId,
      includeGasInfo: true,
    }
  }, [address, amount, chainId, currencyIn, tokenAddress])

  const { data, error } = useRestQuery<ApprovalResponse, ApprovalRequest | Record<string, never>>(
    uniswapUrls.tradingApiPaths.approval,
    approvalRequestArgs ?? {},
    ['approval', 'gasFee'],
    {
      ttlMs: ONE_MINUTE_MS,
      skip: skip || !approvalRequestArgs || isWrap || !address,
    },
    'POST',
    TradingApiApolloClient,
  )

  return useMemo(() => {
    if (error) {
      logger.error(error, {
        tags: { file: 'useTokenApprovalInfo', function: 'useTokenApprovalInfo' },
        extra: {
          approvalRequestArgs,
        },
      })
    }

    if (isWrap) {
      return {
        action: ApprovalAction.None,
        txRequest: null,
      }
    }

    if (data && !error) {
      // API returns null if no approval is required
      if (data.approval === null) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
        }
      }
      if (data.approval) {
        return {
          action: ApprovalAction.Permit2Approve,
          txRequest: data.approval,
          gasFee: data.gasFee,
        }
      }
    }

    // No valid approval type found
    return {
      action: ApprovalAction.Unknown,
      txRequest: null,
    }
  }, [approvalRequestArgs, data, error, isWrap])
}
