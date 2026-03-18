export interface WarningService {
  getSkipBridgingWarning: () => boolean
  getSkipMaxTransferWarning: () => boolean
  getSkipTokenProtectionWarning: () => boolean
  getSkipBridgedAssetWarning: () => boolean
  setSkipBridgedAssetWarning: (skip: boolean) => void
  setSkipBridgingWarning: (skip: boolean) => void
  setSkipMaxTransferWarning: (skip: boolean) => void
  setSkipTokenProtectionWarning: (skip: boolean) => void
  reset: () => void
}
