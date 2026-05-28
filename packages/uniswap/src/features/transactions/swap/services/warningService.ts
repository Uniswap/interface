export interface WarningService {
  getSkipBridgingWarning: () => boolean
  getSkipMaxTransferWarning: () => boolean
  getSkipTokenProtectionWarning: () => boolean
  setSkipBridgingWarning: (skip: boolean) => void
  setSkipMaxTransferWarning: (skip: boolean) => void
  setSkipTokenProtectionWarning: (skip: boolean) => void
  reset: () => void
}
