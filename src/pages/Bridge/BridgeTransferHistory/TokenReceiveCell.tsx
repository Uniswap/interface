import { Text } from 'rebass'

import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import { formatNumberWithPrecisionRange } from 'utils'

type Props = {
  transfer: MultichainTransfer
}

const TokenReceiveCell: React.FC<Props> = ({ transfer }) => {
  return (
    <Text
      as="span"
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
      }}
    >
      {formatNumberWithPrecisionRange(parseFloat(transfer.dstAmount.toString() ?? '0'), 0, 6)} {transfer.dstTokenSymbol}
    </Text>
  )
}

export default TokenReceiveCell
