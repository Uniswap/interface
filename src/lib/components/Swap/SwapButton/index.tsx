import { Trans } from '@lingui/macro'
import { useSwapInfo } from 'lib/hooks/swap'
import { useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { WrapType } from 'lib/hooks/swap/useWrapCallback'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { Field } from 'lib/state/swap'
import { useTheme } from 'lib/theme'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import ActionButton from '../../ActionButton'
import Dialog from '../../Dialog'
import { SummaryDialog } from '../Summary'
import useApprovalData, { useIsPendingApproval } from './useApprovalData'
import useSwapData from './useSwapData'
import useWrapData from './useWrapData'

export default memo(function SwapButton({ disabled: isDisabled }: { disabled?: boolean }) {
  const { chainId } = useActiveWeb3React()
  const {
    [Field.INPUT]: { amount: inputCurrencyAmount, balance: inputCurrencyBalance, usdc: inputUSDC },
    [Field.OUTPUT]: { usdc: outputUSDC },
    trade,
    slippage,
    impact,
  } = useSwapInfo()
  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, slippage.allowed, useIsPendingApproval) || trade.trade

  const wrapData = useWrapData()
  const { approvalData, signatureData } = useApprovalData(optimizedTrade, slippage)
  const swapData = useSwapData(optimizedTrade, slippage, signatureData)

  const [openReview, setOpenReview] = useState(false)
  // Close the review dialog if a trade is no longer available.
  useEffect(() => setOpenReview((openReview) => (trade.trade ? openReview : false)), [trade])
  // Close the review dialog if the chain is changed.
  useEffect(() => setOpenReview(false), [chainId])

  const [props, children = <Trans>Review swap</Trans>] = useMemo(() => {
    const disabled =
      isDisabled ||
      !chainId ||
      !inputCurrencyBalance ||
      !inputCurrencyAmount ||
      inputCurrencyBalance?.lessThan(inputCurrencyAmount)

    if (wrapData) {
      const caption = wrapData.type === WrapType.WRAP ? <Trans>Wrap</Trans> : <Trans>Unwrap</Trans>
      return [{ disabled, onClick: wrapData.callback }, caption]
    } else if (!disabled) {
      if (approvalData) {
        return [{ disabled, ...approvalData }]
      } else if (swapData) {
        return [{ disabled, onClick: () => setOpenReview(true) }]
      }
    }
    return [{ disabled: true }]
  }, [approvalData, chainId, isDisabled, inputCurrencyAmount, inputCurrencyBalance, swapData, wrapData])
  const handleDialogClose = useCallback(() => setOpenReview(false), [])

  const { tokenColorExtraction } = useTheme()
  return (
    <>
      <ActionButton color={tokenColorExtraction ? 'interactive' : 'accent'} {...props}>
        {children}
      </ActionButton>
      {openReview && swapData && trade.trade && (
        <Dialog color="dialog" onClose={handleDialogClose}>
          <SummaryDialog
            trade={trade.trade}
            slippage={slippage}
            inputUSDC={inputUSDC}
            outputUSDC={outputUSDC}
            impact={impact}
            onConfirm={swapData}
          />
        </Dialog>
      )}
    </>
  )
})
