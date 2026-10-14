import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import { spacing } from '@universe/mycelium'
import { useCallback, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useDispatch } from 'react-redux'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import type { MultichainAddressSheetProps } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressSheet'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useBottomScreenGap } from 'uniswap/src/hooks/useBottomScreenGap'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const MIN_SHEET_HEIGHT = 520
const INITIAL_SNAP_PERCENT = 0.65

export function MultichainAddressSheet({ isOpen, chains, onClose }: MultichainAddressSheetProps): JSX.Element | null {
  const { height: screenHeight } = useWindowDimensions()
  const dispatch = useDispatch()
  const trace = useTrace()
  const { bottomScreenTotalGap } = useBottomScreenGap()

  // The sheet draws behind the bottom inset and renders no BottomSheetView, so nothing upstream
  // applies `insets.bottom` — without this the last chain row sits under the Android navigation bar.
  const scrollContentStyle = useMemo(
    () => ({ paddingHorizontal: spacing.spacing24, paddingBottom: bottomScreenTotalGap }),
    [bottomScreenTotalGap],
  )

  const snapPoints = useMemo(() => {
    const percentHeight = INITIAL_SNAP_PERCENT * screenHeight
    const initialSnap = Math.min(Math.max(percentHeight, MIN_SHEET_HEIGHT), screenHeight)
    return [initialSnap, '100%']
  }, [screenHeight])

  const handleCopyAddress = useCallback(
    async (address: string, chainId: UniverseChainId): Promise<void> => {
      await setClipboard(address)
      dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address }))
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.CopyAddress,
        chain_name: getChainInfo(chainId).urlParam,
      })
      onClose()
    },
    [dispatch, onClose, trace],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Modal
      fullScreen
      overrideInnerContainer
      renderBehindBottomInset
      name={ModalName.MultichainAddressModal}
      snapPoints={snapPoints}
      onClose={onClose}
    >
      <BottomSheetScrollView contentContainerStyle={scrollContentStyle} showsVerticalScrollIndicator={false}>
        <MultichainAddressList
          renderedInModal
          chains={chains}
          showInlineFeedback={false}
          onCopyAddress={handleCopyAddress}
        />
      </BottomSheetScrollView>
    </Modal>
  )
}
