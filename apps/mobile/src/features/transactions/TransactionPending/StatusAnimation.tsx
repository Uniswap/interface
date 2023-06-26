import React, { useEffect, useRef } from 'react'
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native'
import { TransactionStatus } from 'wallet/src/features/transactions/types'

const ANIMATION_WIDTH = 250
const ANIMATION_HEIGHT = 250
const stateMachineName = 'State Machine 1'

export function StatusAnimation({
  status,
  transactionType,
}: {
  status?: TransactionStatus
  transactionType: 'swap' | 'send'
}): JSX.Element {
  const animationRef = useRef<RiveRef>(null)

  useEffect(() => {
    if (status === TransactionStatus.Success) {
      animationRef.current?.setInputState(stateMachineName, 'isSuccess', true)
    } else if (status === TransactionStatus.Failed) {
      animationRef.current?.setInputState(stateMachineName, 'isFailure', true)
    }
  }, [status])

  return (
    <Rive
      ref={animationRef}
      autoplay
      alignment={Alignment.BottomCenter}
      artboardName={transactionType === 'swap' ? 'Pending Swap Graphic' : 'Pending Send Graphic'}
      fit={Fit.FitHeight}
      resourceName={transactionType === 'swap' ? 'pending_swap' : 'pending_send'}
      stateMachineName={stateMachineName}
      style={{
        maxHeight: ANIMATION_HEIGHT,
        width: ANIMATION_WIDTH,
      }}
    />
  )
}
