import { t } from '@lingui/macro'

import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

export const getLabelByStatus = (status: MultichainTransferStatus): string => {
  const labelByGeneralStatus: Record<MultichainTransferStatus, string> = {
    [MultichainTransferStatus.Success]: t`Success`,
    [MultichainTransferStatus.Failure]: t`Failed`,
    [MultichainTransferStatus.Processing]: t`Processing`,
  }

  return labelByGeneralStatus[status]
}
