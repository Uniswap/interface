/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Contract } from '@ethersproject/contracts'
import { MaxAllowanceTransferAmount, permit2Address } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount, MaxUint256, Token } from '@uniswap/sdk-core'
import ms from 'ms'
import { useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { PERMIT2_ABI } from 'uniswap/src/abis/permit2'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useEvent } from 'utilities/src/react/hooks'
import { AuctionDetails } from '~/components/Toucan/Auction/store/types'
import { useAccount } from '~/hooks/useAccount'
import { useEthersProvider } from '~/hooks/useEthersProvider'
import usePermit2Allowance, { Allowance, AllowanceState } from '~/hooks/usePermit2Allowance'
import { usePermitAllowance } from '~/hooks/usePermitAllowance'
import { useHasPendingPermit2Approval } from '~/state/transactions/hooks'

interface UseBidPermit2FlowParams {
  budgetAmount: CurrencyAmount<Currency> | undefined
  bidCurrency: Currency | undefined
  auctionDetails: AuctionDetails | null | undefined
}

interface UseBidPermit2FlowResult {
  allowance: Allowance
  isNativeBidToken: boolean
  bidTokenAmount: CurrencyAmount<Token> | undefined
  needsPermit2Allowance: boolean
  permit2ApprovalPending: boolean
  shouldEstimateGas: boolean
  buildPreBidSteps: () => Promise<TransactionStep[]>
  /**
   * Whether we can run simulation before permit2 steps.
   * True when using native token OR when permit2 allowance is already granted.
   */
  canSimulatePrePermit2: boolean
}

export function useBidPermit2Flow({
  budgetAmount,
  bidCurrency,
  auctionDetails,
}: UseBidPermit2FlowParams): UseBidPermit2FlowResult {
  const account = useAccount()
  const provider = useEthersProvider({ chainId: auctionDetails?.chainId as UniverseChainId | undefined })

  const isNativeBidToken = bidCurrency?.isNative ?? false

  const bidTokenAmount = useMemo(
    () => (budgetAmount && bidCurrency?.isToken ? (budgetAmount as CurrencyAmount<Token>) : undefined),
    [bidCurrency?.isToken, budgetAmount],
  )

  const permit2Allowance = usePermit2Allowance({
    amount: isNativeBidToken ? undefined : bidTokenAmount,
    spender: isNativeBidToken ? undefined : auctionDetails?.address,
  })

  const allowance = useMemo((): Allowance => {
    if (isNativeBidToken) {
      return { state: AllowanceState.ALLOWED }
    }
    return permit2Allowance
  }, [isNativeBidToken, permit2Allowance])

  const { permitAllowance, expiration: permitExpiration } = usePermitAllowance({
    token: bidTokenAmount?.currency,
    owner: account.address,
    spender: auctionDetails?.address,
  })

  const isPermit2AllowanceGranted = useMemo(() => {
    if (!bidTokenAmount || permitAllowance === undefined || permitExpiration === undefined) {
      return false
    }
    const now = Math.floor(Date.now() / 1000)
    return (
      (permitAllowance.greaterThan(bidTokenAmount) || permitAllowance.equalTo(bidTokenAmount)) &&
      permitExpiration >= now
    )
  }, [bidTokenAmount, permitAllowance, permitExpiration])

  const needsPermit2Allowance = Boolean(
    !isNativeBidToken &&
      bidTokenAmount &&
      permitAllowance !== undefined &&
      permitExpiration !== undefined &&
      !isPermit2AllowanceGranted,
  )

  const permit2ApprovalPending = useHasPendingPermit2Approval(bidTokenAmount?.currency, auctionDetails?.address)

  // Only estimate gas when ready to submit (no pending approvals needed)
  const shouldEstimateGas = useMemo(() => {
    if (isNativeBidToken) {
      return true
    }
    const hasTokenAllowance = allowance.state === AllowanceState.ALLOWED
    const hasPermitData = permitAllowance !== undefined && permitExpiration !== undefined
    return hasTokenAllowance && hasPermitData && !needsPermit2Allowance
  }, [allowance.state, isNativeBidToken, needsPermit2Allowance, permitAllowance, permitExpiration])

  // Can simulate pre-permit2 when:
  // 1. Native token (no approvals needed), OR
  // 2. Token approval granted AND permit2 allowance already granted
  const canSimulatePrePermit2 = useMemo(() => {
    if (isNativeBidToken) {
      return true
    }
    // Need both token approval and permit2 allowance to simulate
    return allowance.state === AllowanceState.ALLOWED && !needsPermit2Allowance
  }, [isNativeBidToken, allowance.state, needsPermit2Allowance])

  const buildPreBidSteps = useEvent(async (): Promise<TransactionStep[]> => {
    if (
      !provider ||
      !bidTokenAmount ||
      !auctionDetails?.chainId ||
      !auctionDetails.address ||
      !bidTokenAmount.currency.isToken
    ) {
      return []
    }

    const steps: TransactionStep[] = []
    const chainId = auctionDetails.chainId
    const token = bidTokenAmount.currency

    if (allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      const tokenContract = new Contract(token.address, ERC20_ABI, provider)
      const approveTx = await tokenContract.populateTransaction.approve(permit2Address(chainId), MaxUint256.toString())
      const approveTxRequest = validateTransactionRequest({ ...approveTx, to: token.address, chainId })
      const approvalStep = createApprovalTransactionStep({
        amount: bidTokenAmount.quotient.toString(),
        txRequest: approveTxRequest,
        tokenAddress: token.address,
        chainId,
      })
      if (approvalStep) {
        steps.push(approvalStep)
      }
    }

    if (needsPermit2Allowance) {
      const permit2Contract = new Contract(permit2Address(chainId), PERMIT2_ABI, provider)
      const expiration = Math.floor((Date.now() + ms('30d')) / 1000)
      const permit2Tx = await permit2Contract.populateTransaction.approve(
        token.address,
        auctionDetails.address,
        MaxAllowanceTransferAmount,
        expiration,
      )
      const permit2TxRequest = validateTransactionRequest({ ...permit2Tx, to: permit2Address(chainId), chainId })
      if (permit2TxRequest) {
        const permit2Step: Permit2TransactionStep = {
          type: TransactionStepType.Permit2Transaction,
          txRequest: permit2TxRequest,
          token,
          spender: auctionDetails.address,
          amount: MaxAllowanceTransferAmount.toString(),
          tokenAddress: token.address,
        }
        steps.push(permit2Step)
      }
    }

    return steps
  })

  return {
    allowance,
    isNativeBidToken,
    bidTokenAmount,
    needsPermit2Allowance,
    permit2ApprovalPending,
    shouldEstimateGas,
    buildPreBidSteps,
    canSimulatePrePermit2,
  }
}
