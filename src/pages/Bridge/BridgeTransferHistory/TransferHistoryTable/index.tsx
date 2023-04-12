import { useMedia } from 'react-use'

import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import Desktop from 'pages/Bridge/BridgeTransferHistory/TransferHistoryTable/Desktop'
import Mobile from 'pages/Bridge/BridgeTransferHistory/TransferHistoryTable/Mobile'
import { MEDIA_WIDTHS } from 'theme'

export type Props = {
  transfers: MultichainTransfer[]
}

const TransferHistoryTable: React.FC<Props> = props => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  if (upToExtraSmall) {
    return <Mobile {...props} />
  }

  return <Desktop {...props} />
}

export default TransferHistoryTable
