import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { Interface } from '@ethersproject/abi'
import { Contract } from 'ethers/lib/ethers'
import { useEffect, useMemo, useState } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { convertGasFeeToDisplayValue, useActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import {
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export interface TokenApprovalInfoParams {
  chainId: UniverseChainId
  wrapType: WrapType
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  currencyOutAmount?: Maybe<CurrencyAmount<Currency>>
  routing: TradingApi.Routing | undefined
  account?: AccountDetails
}

export type ApprovalTxInfo = {
  tokenApprovalInfo: TokenApprovalInfo
  approvalGasFeeResult: GasFeeResult
  revokeGasFeeResult: GasFeeResult
}

function useApprovalWillBeBatchedWithSwap(chainId: UniverseChainId, routing: TradingApi.Routing | undefined): boolean {
  const canBatchTransactions = useUniswapContextSelector((ctx) => ctx.getCanBatchTransactions?.(chainId))
  const swapDelegationInfo = useUniswapContextSelector((ctx) => ctx.getSwapDelegationInfo?.(chainId))

  const isBatchableFlow = Boolean(routing && !isUniswapX({ routing }))
  const isHashKeyChain = chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet

  if (isHashKeyChain) {
    // HashKey swaps use direct router calldata and are not atomic-batched with approvals.
    return false
  }

  return Boolean((canBatchTransactions || swapDelegationInfo?.delegationAddress) && isBatchableFlow)
}

export function useTokenApprovalInfo(params: TokenApprovalInfoParams): ApprovalTxInfo {
  const { account, chainId, wrapType, currencyInAmount, currencyOutAmount, routing } = params

  const isWrap = wrapType !== WrapType.NotApplicable
  /** Approval is included elsewhere for Chained Actions so it can be skipped */
  const isChained = routing === TradingApi.Routing.CHAINED
  const isHashKeyChain = chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet

  const address = account?.address
  const inputWillBeWrapped = routing && isUniswapX({ routing })
  // Off-chain orders must have wrapped currencies approved, rather than natives.
  const currencyIn = inputWillBeWrapped ? currencyInAmount?.currency.wrapped : currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenInAllowanceAddress = currencyIn?.isNative ? undefined : currencyIn?.wrapped.address
  const tokenInAddress = getTokenAddressForApi(currencyIn)

  // Only used for bridging
  const isBridge = routing === TradingApi.Routing.BRIDGE
  const currencyOut = currencyOutAmount?.currency
  const tokenOutAddress = getTokenAddressForApi(currencyOut)

  const gasStrategy = useActiveGasStrategy(chainId, 'general')
  const erc20Interface = useMemo(() => new Interface(ERC20_ABI), [])

  const approvalWillBeBatchedWithSwap = useApprovalWillBeBatchedWithSwap(chainId, routing)

  const hskRouterAddress = useMemo(() => {
    if (!isHashKeyChain) {
      return undefined
    }
    return CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS[chainId]?.[0]
  }, [chainId, isHashKeyChain])

  const [allowanceState, setAllowanceState] = useState<{
    value: string | undefined
    isLoading: boolean
    error: Error | null
  }>({
    value: undefined,
    isLoading: false,
    error: null,
  })

  const shouldCheckOnchainAllowance = Boolean(
    isHashKeyChain &&
      !isWrap &&
      !approvalWillBeBatchedWithSwap &&
      !isChained &&
      address &&
      amount &&
      tokenInAllowanceAddress &&
      hskRouterAddress,
  )

  useEffect(() => {
    if (!shouldCheckOnchainAllowance) {
      setAllowanceState((prev) =>
        prev.value || prev.isLoading || prev.error ? { value: undefined, isLoading: false, error: null } : prev,
      )
      return
    }

    const provider = createEthersProvider({ chainId })
    if (!provider) {
      setAllowanceState({
        value: undefined,
        isLoading: false,
        error: new Error('No RPC provider available for HashKey allowance check'),
      })
      return
    }

    let cancelled = false
    setAllowanceState((prev) => ({ ...prev, isLoading: true, error: null }))

    ;(async () => {
      try {
        const erc20Contract = new Contract(tokenInAllowanceAddress as string, ERC20_ABI, provider)
        const allowance = await erc20Contract.allowance(address, hskRouterAddress as string)
        if (!cancelled) {
          setAllowanceState({ value: allowance.toString(), isLoading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Allowance check failed')
          setAllowanceState({ value: undefined, isLoading: false, error })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    address,
    amount,
    chainId,
    hskRouterAddress,
    shouldCheckOnchainAllowance,
    tokenInAllowanceAddress,
  ])

  const approvalRequestArgs: TradingApi.ApprovalRequest | undefined = useMemo(() => {
    const tokenInChainId = toTradingApiSupportedChainId(chainId)
    const tokenOutChainId = toTradingApiSupportedChainId(currencyOut?.chainId)

    if (!address || !amount || !currencyIn || !tokenInAddress || !tokenInChainId) {
      return undefined
    }
    if (isBridge && !tokenOutAddress && !tokenOutChainId) {
      return undefined
    }

    return {
      walletAddress: address,
      token: tokenInAddress,
      amount,
      chainId: tokenInChainId,
      includeGasInfo: true,
      tokenOut: tokenOutAddress,
      tokenOutChainId,
      gasStrategies: [gasStrategy],
    }
  }, [
    gasStrategy,
    address,
    amount,
    chainId,
    currencyIn,
    currencyOut?.chainId,
    isBridge,
    tokenInAddress,
    tokenOutAddress,
  ])

  const shouldSkip =
    !approvalRequestArgs || isWrap || !address || approvalWillBeBatchedWithSwap || isChained || isHashKeyChain

  const { data, isLoading, error } = useCheckApprovalQuery({
    params: shouldSkip ? undefined : approvalRequestArgs,
    staleTime: 15 * ONE_SECOND_MS,
    immediateGcTime: ONE_MINUTE_MS,
  })


  const tokenApprovalInfo: TokenApprovalInfo = useMemo(() => {
    if (error) {
      logger.error(error, {
        tags: { file: 'useTokenApprovalInfo', function: 'useTokenApprovalInfo' },
        extra: {
          approvalRequestArgs,
        },
      })
    }

    if (isHashKeyChain) {
      if (allowanceState.error) {
        logger.error(allowanceState.error, {
          tags: { file: 'useTokenApprovalInfo', function: 'useTokenApprovalInfo' },
          extra: {
            address,
            amount,
            chainId,
            hskRouterAddress,
            tokenInAddress: tokenInAllowanceAddress,
          },
        })
      }

      if (isWrap || !address || approvalWillBeBatchedWithSwap || isChained) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      if (!tokenInAllowanceAddress || currencyIn?.isNative) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      if (!shouldCheckOnchainAllowance || allowanceState.isLoading || !allowanceState.value || !amount) {
        return {
          action: ApprovalAction.Unknown,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      try {
        const hasAllowance = BigInt(allowanceState.value) >= BigInt(amount)
        if (hasAllowance) {
          return {
            action: ApprovalAction.None,
            txRequest: null,
            cancelTxRequest: null,
          }
        }
      } catch {
        return {
          action: ApprovalAction.Unknown,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      const txRequest = {
        to: tokenInAllowanceAddress,
        data: erc20Interface.encodeFunctionData('approve', [hskRouterAddress as string, amount]),
        value: '0x0',
        chainId,
      }

      return {
        action: ApprovalAction.Permit2Approve,
        txRequest,
        cancelTxRequest: null,
      }
    }

    // Approval is N/A for wrap transactions or unconnected state.
    if (isWrap || !address || approvalWillBeBatchedWithSwap || isChained) {
      return {
        action: ApprovalAction.None,
        txRequest: null,
        cancelTxRequest: null,
      }
    }

    if (data && !error) {

      // API returns null if no approval is required

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (data.approval === null) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (data.approval) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (data.cancel) {
          return {
            action: ApprovalAction.RevokeAndPermit2Approve,
            txRequest: data.approval,
            cancelTxRequest: data.cancel,
          }
        }

        return {
          action: ApprovalAction.Permit2Approve,
          txRequest: data.approval,
          cancelTxRequest: null,
        }
      }
    }

    // No valid approval type found
    return {
      action: ApprovalAction.Unknown,
      txRequest: null,
      cancelTxRequest: null,
    }
  }, [
    address,
    allowanceState.error,
    allowanceState.isLoading,
    allowanceState.value,
    amount,
    approvalRequestArgs,
    approvalWillBeBatchedWithSwap,
    chainId,
    currencyIn?.isNative,
    data,
    error,
    erc20Interface,
    hskRouterAddress,
    isChained,
    isHashKeyChain,
    isWrap,
    shouldCheckOnchainAllowance,
    tokenInAllowanceAddress,
  ])

  return useMemo(() => {
    const gasEstimate = isHashKeyChain ? undefined : data?.gasEstimates?.[0]
    const noApprovalNeeded = tokenApprovalInfo.action === ApprovalAction.None
    const noRevokeNeeded =
      tokenApprovalInfo.action === ApprovalAction.Permit2Approve || tokenApprovalInfo.action === ApprovalAction.None
    const approvalFee = noApprovalNeeded ? '0' : isHashKeyChain ? undefined : data?.gasFee
    const revokeFee = noRevokeNeeded ? '0' : isHashKeyChain ? undefined : data?.cancelGasFee

    const unknownApproval = tokenApprovalInfo.action === ApprovalAction.Unknown
    const isApprovalLoading = isHashKeyChain ? allowanceState.isLoading : isLoading
    const approvalGasError =
      allowanceState.error ?? (unknownApproval && !isApprovalLoading ? new Error('Approval action unknown') : null)
    const isGasLoading = unknownApproval && isApprovalLoading

    return {
      tokenApprovalInfo,
      approvalGasFeeResult: {
        value: approvalFee,
        displayValue: convertGasFeeToDisplayValue(approvalFee, gasStrategy),
        isLoading: isGasLoading,
        error: approvalGasError,
        gasEstimate,
      },
      revokeGasFeeResult: {
        value: revokeFee,
        displayValue: convertGasFeeToDisplayValue(revokeFee, gasStrategy),
        isLoading: isGasLoading,
        error: approvalGasError,
      },
    }
  }, [
    allowanceState.error,
    allowanceState.isLoading,
    data?.cancelGasFee,
    data?.gasEstimates,
    data?.gasFee,
    gasStrategy,
    isHashKeyChain,
    isLoading,
    tokenApprovalInfo,
  ])
}
