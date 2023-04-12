import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ArrowDown } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { NetworkLogo } from 'components/Logo'
import { NETWORKS_INFO_CONFIG } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import ActionCell from 'pages/Bridge/BridgeTransferHistory/ActionCell'
import StatusBadge from 'pages/Bridge/BridgeTransferHistory/StatusBadge'
import TimeStatusCell from 'pages/Bridge/BridgeTransferHistory/TimeStatusCell'
import TokenReceiveCell from 'pages/Bridge/BridgeTransferHistory/TokenReceiveCell'

import { Props } from './index'

const TableHeader = styled.div`
  width: 100%;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 20px 20px 0 0;
`

const TableColumnText = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const TableRowForMobile = styled.div`
  width: 100%;
  padding: 12px 16px;

  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  &:last-child {
    border-bottom: none;
  }
`

const ChainWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  color: ${({ theme }) => theme.subText};
`
const ChainDisplay: React.FC<{ chainId: ChainId }> = ({ chainId }) => {
  const chainInfo = NETWORKS_INFO_CONFIG[chainId]
  if (chainInfo) {
    return (
      <ChainWrapper>
        <NetworkLogo chainId={chainId} style={{ width: 18, height: 18 }} />
        <span>{chainInfo.name}</span>
      </ChainWrapper>
    )
  }

  return (
    <ChainWrapper>
      <InfoHelper
        placement="top"
        size={18}
        text={t`ChainId: ${chainId} not supported`}
        fontSize={12}
        style={{
          marginLeft: '0px',
        }}
      />
      <span>
        <Trans>Not supported</Trans>
      </span>
    </ChainWrapper>
  )
}

const Mobile: React.FC<Props> = ({ transfers }) => {
  const theme = useTheme()

  return (
    <Flex flexDirection="column" style={{ flex: 1 }}>
      <TableHeader>
        <TableColumnText>
          <Trans>ROUTE</Trans>
        </TableColumnText>

        <TableColumnText>
          <Trans>AMOUNT</Trans>
        </TableColumnText>
      </TableHeader>

      {transfers.map((transfer, i) => (
        <TableRowForMobile key={i}>
          <Flex
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <StatusBadge status={transfer.status} />
            <ActionCell hash={transfer.srcTxHash} />
          </Flex>

          <Flex
            sx={{
              flexDirection: 'column',
            }}
          >
            <Flex
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <ChainDisplay chainId={Number(transfer.srcChainId) as ChainId} />
              <TokenReceiveCell transfer={transfer} />
            </Flex>

            <Flex
              sx={{
                alignItems: 'center',
                height: '12px',
                marginLeft: '5px',
              }}
            >
              <ArrowDown width="8px" height="8px" color={theme.subText} />
            </Flex>

            <Flex
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <ChainDisplay chainId={Number(transfer.dstChainId) as ChainId} />
              <TimeStatusCell timestamp={transfer.createdAt * 1000} />
            </Flex>
          </Flex>
        </TableRowForMobile>
      ))}
    </Flex>
  )
}

export default Mobile
