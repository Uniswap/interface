import { default as LottieView } from 'lottie-react-native'
import React, { memo, useEffect, useRef } from 'react'
import TransactionFailedAnimation from 'src/assets/lottie/transaction_failed.json'
import TransactionPendingAnimation from 'src/assets/lottie/transaction_pending.json'
import TransactionSuccessAnimation from 'src/assets/lottie/transaction_success.json'
import { TransactionStatus } from 'src/features/transactions/types'

function getStatusAnimationProps(status?: TransactionStatus) {
  switch (status) {
    case TransactionStatus.Success:
      return {
        source: TransactionSuccessAnimation,
        loop: false,
      }
    case TransactionStatus.Failed:
      return {
        source: TransactionFailedAnimation,
        loop: false,
      }
    default:
      return {
        source: TransactionPendingAnimation,
        loop: true,
      }
  }
}

function _StatusAnimation({ status }: { status?: TransactionStatus }) {
  const animationRef = useRef<LottieView | null>(null)

  useEffect(() => {
    // whenever status changes, play the relevant animation
    animationRef.current?.play()
  }, [status])

  const { source, loop } = getStatusAnimationProps(status)

  return (
    <LottieView
      ref={(animation) => (animationRef.current = animation)}
      autoSize
      loop={loop}
      source={source}
    />
  )
}

export const StatusAnimation = memo(_StatusAnimation)
