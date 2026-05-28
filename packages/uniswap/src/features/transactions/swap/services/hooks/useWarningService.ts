import { useRef } from 'react'
import { WarningService } from 'uniswap/src/features/transactions/swap/services/warningService'
import { useEvent } from 'utilities/src/react/hooks'

// useRef because we need value access to be synchronous
export function useWarningService(): WarningService {
  const skipBridgingWarningRef = useRef(false)
  const skipMaxTransferWarningRef = useRef(false)
  const skipTokenProtectionWarningRef = useRef(false)
  const skipBridgedAssetWarningRef = useRef(false)

  const reset = useEvent(() => {
    skipBridgingWarningRef.current = false
    skipMaxTransferWarningRef.current = false
    skipTokenProtectionWarningRef.current = false
    skipBridgedAssetWarningRef.current = false
  })

  const getSkipBridgingWarning = useEvent(() => skipBridgingWarningRef.current)
  const getSkipMaxTransferWarning = useEvent(() => skipMaxTransferWarningRef.current)
  const getSkipTokenProtectionWarning = useEvent(() => skipTokenProtectionWarningRef.current)
  const getSkipBridgedAssetWarning = useEvent(() => skipBridgedAssetWarningRef.current)

  const setSkipBridgingWarning = useEvent((value: boolean) => {
    skipBridgingWarningRef.current = value
  })
  const setSkipMaxTransferWarning = useEvent((value: boolean) => {
    skipMaxTransferWarningRef.current = value
  })
  const setSkipTokenProtectionWarning = useEvent((value: boolean) => {
    skipTokenProtectionWarningRef.current = value
  })
  const setSkipBridgedAssetWarning = useEvent((value: boolean) => {
    skipBridgedAssetWarningRef.current = value
  })

  return {
    getSkipBridgingWarning,
    getSkipMaxTransferWarning,
    getSkipTokenProtectionWarning,
    setSkipBridgingWarning,
    setSkipMaxTransferWarning,
    setSkipTokenProtectionWarning,
    getSkipBridgedAssetWarning,
    setSkipBridgedAssetWarning,
    reset,
  }
}
