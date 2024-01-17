import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ApprovalAction, TokenApprovalInfo } from 'src/features/transactions/swap/hooks'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'
import {
  ApprovalRequest,
  ApprovalResponse,
  ChainId as TradingApiChainId,
} from 'wallet/src/data/tradingApi/__generated__/api'
import { TradingApiApolloClient } from 'wallet/src/features/transactions/swap/tradingApi/client'
import { getTokenAddressForApiRequest } from 'wallet/src/features/transactions/swap/tradingApi/utils'
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

  const address = useActiveAccountAddressWithThrow()
  const currencyIn = currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenAddress = getTokenAddressForApiRequest(currencyIn)

  const approvalRequestArgs: ApprovalRequest | undefined = useMemo(() => {
    if (!amount || !currencyIn || !tokenAddress) {
      return undefined
    }
    return {
      walletAddress: address,
      token: tokenAddress,
      amount,
      chainId: chainId as TradingApiChainId,
      includeGasInfo: true,
    }
  }, [address, amount, chainId, currencyIn, tokenAddress])

  const { data, error } = useRestQuery<ApprovalResponse, ApprovalRequest | Record<string, never>>(
    uniswapUrls.tradingApiPaths.approval,
    approvalRequestArgs ?? {},
    ['approval'],
    {
      ttlMs: ONE_MINUTE_MS,
      skip: skip || !approvalRequestArgs || wrapType !== WrapType.NotApplicable,
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

    if (!data?.approval || error) {
      return {
        action: ApprovalAction.Unknown,
        txRequest: null,
      }
    }

    return {
      action: ApprovalAction.Permit2Approve,
      txRequest: data.approval,
      gasFee: data.gasFee,
    }
  }, [approvalRequestArgs, data, error])
}
