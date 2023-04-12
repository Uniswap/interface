import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import { MouseoverTooltip } from 'components/Tooltip'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { ExternalLink } from 'theme'

type Props = {
  transfer: MultichainTransfer
}

const TokenReceiveCell: React.FC<Props> = ({ transfer }) => {
  const theme = useTheme()

  const dstTokenSymbol = transfer.dstTokenSymbol
  const tooltipText = (
    <Text>
      <Trans>
        You have received some any{dstTokenSymbol} from Multichain. You can exchange your any{dstTokenSymbol} to{' '}
        {dstTokenSymbol} at Multichain, when the pool has sufficient liquidity.
      </Trans>{' '}
      <ExternalLink href="https://app.multichain.org/#/pool">See here ↗</ExternalLink>
    </Text>
  )
  return (
    <Flex
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        gap: '4px',
        color: transfer.isReceiveAnyToken ? theme.warning : undefined,
      }}
    >
      <span>{formatAmountBridge(transfer.dstAmount)}</span> <span>{transfer.dstTokenSymbol}</span>{' '}
      {transfer.isReceiveAnyToken && (
        <MouseoverTooltip text={tooltipText} placement="top">
          <Info size={16} />
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

export default TokenReceiveCell
