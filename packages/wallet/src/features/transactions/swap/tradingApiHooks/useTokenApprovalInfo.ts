import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'
import { ApprovalRequest, ApprovalResponse } from 'wallet/src/data/tradingApi/__generated__/api'
import { ApprovalAction, TokenApprovalInfo } from 'wallet/src/features/transactions/swap/hooks'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/tradingApi/client'
import {
  getTokenAddressForApiRequest,
  toTradingApiSupportedChainId,
} from 'wallet/src/features/transactions/swap/tradingApi/utils'
import { WrapType } from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface TokenApprovalInfoParams {
  chainId: ChainId
  wrapType: WrapType
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  skip?: boolean
}

export function useTokenApprovalInfo(
  params: TokenApprovalInfoParams
): (TokenApprovalInfo & { gasFee?: string }) | undefined {
  const { chainId, wrapType, currencyInAmount, skip } = params

  const isWrap = wrapType !== WrapType.NotApplicable

  const address = useActiveAccountAddressWithThrow()
  const currencyIn = currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenAddress = getTokenAddressForApiRequest(currencyIn)

  const approvalRequestArgs: ApprovalRequest | undefined = useMemo(() => {
    const supportedChainid = toTradingApiSupportedChainId(chainId)

    if (!amount || !currencyIn || !tokenAddress || !supportedChainid) {
      return undefined
    }
    return {
      walletAddress: address,
      token: tokenAddress,
      amount,
      chainId: supportedChainid,
      includeGasInfo: true,
    }
  }, [address, amount, chainId, currencyIn, tokenAddress])

  const { data, error } = useRestQuery<ApprovalResponse, ApprovalRequest | Record<string, never>>(
    uniswapUrls.tradingApiPaths.approval,
    approvalRequestArgs ?? {},
    ['approval', 'gasFee'],
    {
      ttlMs: ONE_MINUTE_MS,
      skip: skip || !approvalRequestArgs || isWrap,
    },
    'POST',
    TradingApiApolloClient
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
