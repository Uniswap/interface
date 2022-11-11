import React, { useEffect, useRef } from 'react'
import Rive, { Alignment, Fit, RiveRef } from 'rive-react-native'
import { TransactionStatus } from 'src/features/transactions/types'

const ANIMATION_WIDTH = 250
const ANIMATION_HEIGHT = 250
const stateMachineName = 'State Machine 1'

export function StatusAnimation({
  status,
  transactionType,
}: {
  status?: TransactionStatus
  transactionType: 'swap' | 'send'
}) {
  const animationRef = useRef<RiveRef>(null)

  useEffect(() => {
    if (status === TransactionStatus.Success) {
      animationRef.current?.setInputState(stateMachineName, 'isLoaded', true)
    } else if (status === TransactionStatus.Failed) {
      animationRef.current?.setInputState(stateMachineName, 'isError', true)
    }
  }, [status])

  return (
    <Rive
      ref={animationRef}
      autoplay
      alignment={Alignment.Center}
      artboardName={transactionType === 'swap' ? 'Pending swap graphic' : 'Pending send graphic'}
      fit={Fit.FitWidth}
      resourceName="Transactions"
      stateMachineName={stateMachineName}
      style={{
        maxHeight: ANIMATION_HEIGHT,
        width: ANIMATION_WIDTH,
      }}
    />
  )
}
