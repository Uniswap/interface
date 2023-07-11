import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { ChainId, CurrencyAmount, Token } from '@thinkincoin-libs/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@thinkincoin/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { isSupportedChain } from 'constants/chains'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { useCallback, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'

function getURAddress(chainId?: number, nftURAddress?: string) {
  if (!chainId) return

  // if mainnet and on NFT flow, use the contract address returned by GQL
  if (chainId === ChainId.MAINNET) {
    return nftURAddress ?? UNIVERSAL_ROUTER_ADDRESS(chainId)
  }

  return isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined
}

export default function usePermit2Approval(
  amount: CurrencyAmount<Token> | undefined,
  maximumAmount: CurrencyAmount<Token> | undefined,
  nftUniversalRouterContractAddress?: string
) {
  const { chainId } = useWeb3React()

  const universalRouterAddress = getURAddress(chainId, nftUniversalRouterContractAddress)
  const allowanceAmount = maximumAmount ?? (amount?.currency.isToken ? (amount as CurrencyAmount<Token>) : undefined)
  const allowance = usePermit2Allowance(allowanceAmount, universalRouterAddress)
  const isApprovalLoading = allowance.state === AllowanceState.REQUIRED && allowance.isApprovalLoading
  const [isAllowancePending, setIsAllowancePending] = useState(false)
  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setIsAllowancePending(true)
    try {
      await allowance.approveAndPermit()
      sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
        chain_id: chainId,
        token_symbol: maximumAmount?.currency.symbol,
        token_address: maximumAmount?.currency.address,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsAllowancePending(false)
    }
  }, [allowance, chainId, maximumAmount?.currency.address, maximumAmount?.currency.symbol])

  return useMemo(() => {
    return {
      allowance,
      isApprovalLoading,
      isAllowancePending,
      updateAllowance,
    }
  }, [allowance, isAllowancePending, isApprovalLoading, updateAllowance])
}
