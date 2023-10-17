import { useWeb3React } from '@web3-react/core'
import { OrderContent } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import Column from 'components/Column'
import { Sign } from 'components/Icons/Sign'
import { Swap } from 'components/Icons/Swap'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { SupportArticleURL } from 'constants/supportArticles'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
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

import { ConfirmModalState } from '../ConfirmSwapModal'
import { Step, StepDetails, StepStatus } from './Step'

const StyledDivider = styled(Divider)`
  margin: 16px 0px;
`
const Line = styled.div`
  width: 2px;
  height: 24px;
  background-color: ${({ theme }) => theme.neutral3};
  margin: 4px 11px;
`
type ProgressIndicatorStep = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>

export function ProgressIndicator({
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

  const swapStatus = useSwapTransactionStatus(swapResult)
  const order = useOrder(swapResult?.type === TradeFillType.UniswapX ? swapResult.response.orderHash : '')

  const swapConfirmed = swapStatus === TransactionStatus.Confirmed || order?.status === UniswapXOrderStatus.FILLED
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

  // TODO: update timeToEnd with dynamic value, calculated as approx. the most recent block confirmation time
  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.WRAPPING]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: `Wrap ${nativeCurrency.symbol}`,
        actionRequiredTitle: `Wrap  ${nativeCurrency.symbol} in wallet`,
        inProgressTitle: `Wrapping  ${nativeCurrency.symbol}...`,
        timeToEnd: 15,
        delayedTitle: 'Longer than expected...',
        learnMoreLinkText: `Why do I have to wrap my ${nativeCurrency.symbol}?`,
        learnMoreLinkHref: SupportArticleURL.WETH_EXPLAINER,
      },
      [ConfirmModalState.RESETTING_TOKEN_ALLOWANCE]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: `Reset ${trade?.inputAmount.currency.symbol} limit`,
        actionRequiredTitle: `Reset ${trade?.inputAmount.currency.symbol} limit in wallet`,
        inProgressTitle: `Resetting ${trade?.inputAmount.currency.symbol} limit...`,
        timeToEnd: 15,
        delayedTitle: 'Longer than expected...',
      },
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} />,
        rippleColor: inputTokenColor,
        previewTitle: `Approve ${trade?.inputAmount.currency.symbol} spending`,
        actionRequiredTitle: `Approve in wallet`,
        inProgressTitle: 'Approval pending...',
        timeToEnd: 15,
        delayedTitle: 'Longer than expected...',
        learnMoreLinkText: 'Why do I have to approve a token?',
        learnMoreLinkHref: SupportArticleURL.APPROVALS_EXPLAINER,
      },
      [ConfirmModalState.PERMITTING]: {
        icon: <Sign />,
        rippleColor: '#FC72FF',
        previewTitle: 'Sign message',
        actionRequiredTitle: 'Sign message in wallet',
        learnMoreLinkText: 'Why do I have to approve a token?',
        learnMoreLinkHref: SupportArticleURL.APPROVALS_EXPLAINER,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: <Swap />,
        rippleColor: '#4C82FB',
        previewTitle: 'Confirm swap',
        actionRequiredTitle: 'Confirm swap in wallet',
        inProgressTitle: 'Swap pending...',
        timeToEnd: 20,
        delayedEndTitle: 'Longer than expected...',
        ...(trade?.fillType === TradeFillType.UniswapX
          ? {
              timeToStart: trade.order.info.deadline - Math.floor(Date.now() / 1000),
              delayedStartTitle: 'Confirmation timed out. Please retry.',
            }
          : {}),
      },
    }),
    [inputTokenColor, nativeCurrency.symbol, trade]
  )

  // TODO: update single-step content; currently falling back to v1 experience
  if (steps.length === 0) {
    return null
  }

  // Return finalized-order-specifc content if available
  if (order && order.status !== UniswapXOrderStatus.OPEN) {
    return <OrderContent order={{ status: order.status, orderHash: order.orderHash, details: order }} />
  }

  return (
    <Column>
      <StyledDivider />
      {steps.map((step, i) => {
        return (
          <>
            <Step key={i} stepStatus={getStatus(step)} stepDetails={stepDetails[step]} />
            {i !== steps.length - 1 && <Line />}
          </>
        )
      })}
      {!!stepDetails[currentStep].learnMoreLinkHref && (
        <Row justify="center" width="100%" padding="16px">
          <ExternalLink href={stepDetails[currentStep].learnMoreLinkHref || ''}>
            {stepDetails[currentStep].learnMoreLinkText}
          </ExternalLink>
        </Row>
      )}
    </Column>
  )
}
