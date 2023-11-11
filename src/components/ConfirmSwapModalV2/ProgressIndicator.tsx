import { t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { OrderContent } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import Column from 'components/Column'
import { Sign } from 'components/Icons/Sign'
import { Swap } from 'components/Icons/Swap'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { SupportArticleURL } from 'constants/supportArticles'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { useBlockConfirmationTime } from 'hooks/useBlockConfirmationTime'
import { SwapResult } from 'hooks/useSwapCallback'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useEffect, useMemo, useState } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { useOrder } from 'state/signatures/hooks'
import { useIsTransactionConfirmed, useSwapTransactionStatus } from 'state/transactions/hooks'
import styled from 'styled-components'
import { Divider, ExternalLink } from 'theme/components'
import { SignatureExpiredError } from 'utils/errors'

import { ConfirmModalState } from '../swap/ConfirmSwapModal'
import { Step, StepDetails, StepStatus } from './Step'

const StyledDivider = styled(Divider)`
  margin: 30px 0px;
`
const StepConnector = styled.div`
  width: 2px;
  height: 24px;
  background-color: ${({ theme }) => theme.neutral3};
  margin: 4px 11px;
`
const ExternalLinkContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 16px;
  padding-bottom: 4px;
`
type ProgressIndicatorStep = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>
export default function ProgressIndicator({
  steps,
  currentStep,
  trade,
  swapResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
  swapError,
  inputTokenColor,
  onRetryUniswapXSignature,
}: {
  steps: ProgressIndicatorStep[]
  currentStep: ProgressIndicatorStep
  trade?: InterfaceTrade
  swapResult?: SwapResult
  wrapTxHash?: string
  tokenApprovalPending?: boolean
  revocationPending?: boolean
  swapError?: Error | string
  inputTokenColor?: string
  onRetryUniswapXSignature?: () => void
}) {
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)
  // Dynamic estimation of transaction wait time based on confirmation of previous block
  const { blockConfirmationTime } = useBlockConfirmationTime()
  const [estimatedTransactionTime, setEstimatedTransactionTime] = useState<number>()
  useEffect(() => {
    // Value continuously updates as new blocks get confirmed
    // Only set step timers once to prevent resetting
    if (blockConfirmationTime && !estimatedTransactionTime) {
      setEstimatedTransactionTime(blockConfirmationTime)
    }
  }, [blockConfirmationTime, estimatedTransactionTime])

  const swapStatus = useSwapTransactionStatus(swapResult)
  const uniswapXOrder = useOrder(swapResult?.type === TradeFillType.UniswapX ? swapResult.response.orderHash : '')

  const swapConfirmed =
    swapStatus === TransactionStatus.Confirmed || uniswapXOrder?.status === UniswapXOrderStatus.FILLED
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = swapResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash != undefined && !wrapConfirmed
  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  const [signatureExpiredErrorId, setSignatureExpiredErrorId] = useState('')
  useEffect(() => {
    if (swapError instanceof SignatureExpiredError && swapError.id !== signatureExpiredErrorId) {
      setSignatureExpiredErrorId(swapError.id)
      onRetryUniswapXSignature?.()
    }
  }, [onRetryUniswapXSignature, signatureExpiredErrorId, swapError])

  function getStatus(targetStep: ProgressIndicatorStep) {
    const currentIndex = steps.indexOf(currentStep)
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.PREVIEW
    } else if (currentIndex === targetIndex) {
      return transactionPending ? StepStatus.IN_PROGRESS : StepStatus.ACTIVE
    } else {
      return StepStatus.COMPLETE
    }
  }

  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.WRAPPING]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: t`Wrap ${nativeCurrency.symbol}`,
        actionRequiredTitle: t`Wrap  ${nativeCurrency.symbol} in wallet`,
        inProgressTitle: t`Wrapping  ${nativeCurrency.symbol}...`,
        timeToEnd: estimatedTransactionTime,
        delayedEndTitle: t`Longer than expected...`,
        learnMoreLinkText: t`Why do I have to wrap my ${nativeCurrency.symbol}?`,
        learnMoreLinkHref: SupportArticleURL.WETH_EXPLAINER,
      },
      [ConfirmModalState.RESETTING_TOKEN_ALLOWANCE]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: t`Reset ${trade?.inputAmount.currency.symbol} limit`,
        actionRequiredTitle: t`Reset ${trade?.inputAmount.currency.symbol} limit in wallet`,
        inProgressTitle: t`Resetting ${trade?.inputAmount.currency.symbol} limit...`,
        timeToEnd: estimatedTransactionTime,
        delayedEndTitle: t`Longer than expected...`,
      },
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: t`Approve ${trade?.inputAmount.currency.symbol} spending`,
        actionRequiredTitle: t`Approve in wallet`,
        inProgressTitle: t`Approval pending...`,
        timeToEnd: estimatedTransactionTime,
        delayedEndTitle: t`Longer than expected...`,
        learnMoreLinkText: t`Why do I have to approve a token?`,
        learnMoreLinkHref: SupportArticleURL.APPROVALS_EXPLAINER,
      },
      [ConfirmModalState.PERMITTING]: {
        icon: <Sign />,
        rippleColor: '#FC72FF',
        previewTitle: t`Sign message`,
        actionRequiredTitle: t`Sign message in wallet`,
        learnMoreLinkText: t`Why are signatures required?`,
        learnMoreLinkHref: SupportArticleURL.APPROVALS_EXPLAINER,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: <Swap />,
        rippleColor: '#4C82FB',
        previewTitle: t`Confirm swap`,
        actionRequiredTitle: t`Confirm swap in wallet`,
        inProgressTitle: t`Swap pending...`,
        timeToEnd: estimatedTransactionTime,
        delayedEndTitle: t`Longer than expected...`,
        ...(trade?.fillType === TradeFillType.UniswapX
          ? {
              timeToStart: trade.order.info.deadline - Math.floor(Date.now() / 1000),
              delayedStartTitle: t`Confirmation timed out. Please retry.`,
            }
          : {}),
      },
    }),
    [inputTokenColor, nativeCurrency.symbol, trade, estimatedTransactionTime]
  )

  if (steps.length === 0) {
    return null
  }

  // Return finalized-order-specifc content if available
  if (uniswapXOrder && uniswapXOrder.status !== UniswapXOrderStatus.OPEN) {
    return (
      <OrderContent
        order={{ status: uniswapXOrder.status, orderHash: uniswapXOrder.orderHash, details: uniswapXOrder }}
      />
    )
  }

  return (
    <Column>
      <StyledDivider />
      {steps.map((step, i) => {
        return (
          <>
            <Step key={`progress-indicator-step-${i}`} stepStatus={getStatus(step)} stepDetails={stepDetails[step]} />
            {i !== steps.length - 1 && <StepConnector />}
          </>
        )
      })}
      {!!stepDetails[currentStep].learnMoreLinkHref && (
        <ExternalLinkContainer>
          <ExternalLink href={stepDetails[currentStep].learnMoreLinkHref || ''}>
            {stepDetails[currentStep].learnMoreLinkText}
          </ExternalLink>
        </ExternalLinkContainer>
      )}
    </Column>
  )
}
