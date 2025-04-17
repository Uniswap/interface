import { useSwapFormWarningState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormWarningStateContext'
import { usePrepareSwap } from 'uniswap/src/features/transactions/swap/services/hooks/usePrepareSwap'
import { useWarningService } from 'uniswap/src/features/transactions/swap/services/hooks/useWarningService'
import { useEvent } from 'utilities/src/react/hooks'

type CallbackArgs = Record<'skipBridgingWarning' | 'skipTokenProtectionWarning' | 'skipMaxTransferWarning', boolean>

export type OnReviewPress = (options: CallbackArgs) => void

type PressHandler = () => void

type UseOnReviewPress = () => {
  onReviewPress: OnReviewPress
  handleOnReviewPress: PressHandler
  handleOnAcknowledgeTokenWarningPress: PressHandler
  handleOnAcknowledgeLowNativeBalancePress: PressHandler
}

/**
 * TODO(WALL-5600): refactor this so all previous warnings are skipped
 *
 * Order of modals:
 * 1. Token protection warning
 * 2. Bridging warning
 * 3. Low native balance warning
 *
 * When skipping, ensure the previous modals are skipped as well to prevent an infinite loop
 * (eg if you skip bridging warning, you should also skip token protection warning)
 */
export const useOnReviewPress: UseOnReviewPress = () => {
  const { handleHideTokenWarningModal, handleHideMaxNativeTransferModal } = useSwapFormWarningState()

  const warningService = useWarningService()

  const prepareSwap = usePrepareSwap({ warningService })

  const onReviewPress: OnReviewPress = useEvent(
    ({ skipBridgingWarning, skipTokenProtectionWarning, skipMaxTransferWarning }) => {
      warningService.setSkipBridgingWarning(skipBridgingWarning)
      warningService.setSkipMaxTransferWarning(skipMaxTransferWarning)
      warningService.setSkipTokenProtectionWarning(skipTokenProtectionWarning)
      prepareSwap()
    },
  )

  const handleOnReviewPress: PressHandler = useEvent(() => {
    onReviewPress({
      skipBridgingWarning: false,
      skipMaxTransferWarning: false,
      skipTokenProtectionWarning: false,
    })
  })

  const handleOnAcknowledgeTokenWarningPress: PressHandler = useEvent(() => {
    handleHideTokenWarningModal()
    onReviewPress({
      skipBridgingWarning: false,
      skipMaxTransferWarning: false,
      skipTokenProtectionWarning: true,
    })
  })

  const handleOnAcknowledgeLowNativeBalancePress: PressHandler = useEvent(() => {
    handleHideMaxNativeTransferModal()
    onReviewPress({
      skipBridgingWarning: true,
      skipMaxTransferWarning: true,
      skipTokenProtectionWarning: true,
    })
  })

  return {
    onReviewPress,
    handleOnReviewPress,
    handleOnAcknowledgeTokenWarningPress,
    handleOnAcknowledgeLowNativeBalancePress,
  }
}
