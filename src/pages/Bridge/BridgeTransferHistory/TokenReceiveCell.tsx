import { Text } from 'rebass'

import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'

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
      {transfer.dstAmount} {transfer.dstTokenSymbol}
    </Text>
  )
}

export default TokenReceiveCell
