import React, { useCallback, useMemo } from 'react'
import { TokenAmount } from '@swapr/sdk'
import { useActiveWeb3React } from '../../../hooks'
import { AutoColumn } from '../../Column'
import { RowBetween } from '../../Row'
import { ApprovalState, useApproveCallback } from '../../../hooks/useApproveCallback'
import { CONVERTER_ADDRESS } from '../../../constants'
import { ButtonPrimary } from '../../Button'
import ProgressCircles from '../../ProgressSteps'
import { useConvertSwprCallback } from '../../../hooks/swpr/useConvertSwprCallback'
import { useTransactionAdder } from '../../../state/transactions/hooks'

interface ConvertFlowProps {
  oldSwprBalance: TokenAmount
  onError: () => void
}

export function ConvertFlow({ oldSwprBalance, onError }: ConvertFlowProps) {
  const { chainId, account } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const spender = useMemo(() => (chainId ? CONVERTER_ADDRESS[chainId] : undefined), [chainId])
  const [approvalState, approveCallback] = useApproveCallback(oldSwprBalance, spender)
  const convertSwprCallback = useConvertSwprCallback(account || undefined)

  const handleConvert = useCallback(() => {
    if (!convertSwprCallback) return
    convertSwprCallback()
      .then(transaction => {
        addTransaction(transaction, {
          summary: `Convert ${oldSwprBalance.toFixed(3)} old SWPR to new SWPR`
        })
      })
      .catch(error => {
        console.log(error)
        onError()
      })
  }, [addTransaction, convertSwprCallback, oldSwprBalance, onError])

  return (
    <AutoColumn>
      <RowBetween mt="1rem" mb="1rem">
        <ButtonPrimary width="48%" onClick={approveCallback} disabled={approvalState !== ApprovalState.NOT_APPROVED}>
          Approve
        </ButtonPrimary>
        <ButtonPrimary width="48%" onClick={handleConvert} disabled={approvalState !== ApprovalState.APPROVED}>
          Convert
        </ButtonPrimary>
      </RowBetween>
      <ProgressCircles steps={[approvalState === ApprovalState.APPROVED]} />
    </AutoColumn>
  )
}
