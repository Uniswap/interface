import React, { useCallback } from 'react'
import styled from 'styled-components'
import { AdvancedDetailsFooter } from '../../components/AdvancedDetailsFooter'
import { ButtonPrimary, ShowMoreButton } from '../../components/Button'
import { BridgeTransactionStatus, BridgeTransactionSummary } from '../../state/bridgeTransactions/types'
import { BridgeStatusTag } from './BridgeStatusTag'
import { useBridgeTxsFilter } from '../../state/bridge/hooks'
import { BridgeTxsFilter } from '../../state/bridge/reducer'
import { getExplorerLink } from '../../utils'
import { getNetworkInfo } from '../../utils/networksList'

const Container = styled.div`
  display: flex;
  flex-flow: column;
`

const Body = styled.div`
  flex-flow: column;
  justify-content: space-between;
`

const Row = styled.div`
  display: flex;
  flex-flow: row;
  text-align: end;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0rem;
  font-weight: 500;
  font-size: 0.825rem;
  color: ${({ theme }) => theme.text5};
`

const Header = styled(Row)`
  justify-content: space-evenly;
  line-height: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${props => props.theme.purple3};
`

const ColumnBridging = styled.div`
  width: 25%;
  text-align: start;
`

const ColumnFrom = styled.div`
  width: 20%;
`

const ColumnTo = styled.div`
  width: 35%;
`

const ColumnStatus = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 20%;
  margin: 0px 0px 0px 5px;
`

const ColumnToFlex = styled(ColumnTo)`
  display: flex;
  align-items: center;
`

const Link = styled.a`
  cursor: initial;
  color: ${props => props.theme.green2};

  &[href] {
    cursor: pointer;
  }

  &[href]:hover {
    text-decoration: underline;
  }
`

const Filler = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0px 5px;
`

const Dots = styled.div<{ status: BridgeTransactionStatus }>`
  display: flex;
  height: 100%;
  overflow: hidden;
  width: 50%;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme, status }) =>
    status === 'confirmed' || status === 'claimed' ? theme.green2 : status === 'failed' ? theme.red2 : theme.purple3};

  &:after {
    font-size: 14px;
    content: '\\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7 \\00B7';
  }
`

const TextBridging = styled.div`
  font-size: 12px;
  line-height: 12px;
  color: ${props => props.theme.text1};
`

const TextFrom = styled.div`
  font-size: 10px;
  line-height: 12px;
  color: ${props => props.theme.text4};
`

const TextTo = styled(Link)<{ status: BridgeTransactionStatus }>`
  font-size: 10px;
  line-height: 12px;
  color: ${({ theme, status }) =>
    status === 'confirmed' || status === 'claimed' ? theme.green2 : status === 'failed' ? theme.red2 : theme.purple3};
`
interface BridgeTransactionsSummaryProps {
  transactions: BridgeTransactionSummary[]
  collectableTx: BridgeTransactionSummary
  onCollect: (tx: BridgeTransactionSummary) => void
}

export const BridgeTransactionsSummary = ({
  transactions,
  collectableTx,
  onCollect
}: BridgeTransactionsSummaryProps) => {
  const [txsFilter, setTxsFilter] = useBridgeTxsFilter()

  const toggleFilter = useCallback(() => {
    if (txsFilter !== BridgeTxsFilter.NONE) setTxsFilter(BridgeTxsFilter.NONE)
    else setTxsFilter(BridgeTxsFilter.RECENT)
  }, [setTxsFilter, txsFilter])

  return (
    <>
      <AdvancedDetailsFooter fullWidth padding="12px">
        <Container>
          <Header>
            <ColumnBridging>Bridging</ColumnBridging>
            <ColumnFrom>From</ColumnFrom>
            <ColumnTo>To</ColumnTo>
            <ColumnStatus>Status</ColumnStatus>
          </Header>
          <Body>
            {Object.values(transactions).map((tx, index) => (
              <BridgeTransactionsSummaryRow key={index} tx={tx} onCollect={onCollect} />
            ))}
          </Body>
        </Container>
        {collectableTx && (
          <ButtonPrimary onClick={() => onCollect(collectableTx)} mt="12px">
            Collect
          </ButtonPrimary>
        )}
      </AdvancedDetailsFooter>

      <ShowMoreButton isOpen={txsFilter === BridgeTxsFilter.NONE} onClick={toggleFilter}>
        Past transactions
      </ShowMoreButton>
    </>
  )
}

interface BridgeTransactionsSummaryRow {
  tx: BridgeTransactionSummary
  onCollect: BridgeTransactionsSummaryProps['onCollect']
}

const BridgeTransactionsSummaryRow = ({ tx, onCollect }: BridgeTransactionsSummaryRow) => {
  const { assetName, fromChainId, status, toChainId, value, pendingReason, log } = tx
  const fromChainName = getNetworkInfo(fromChainId).name
  const toChainName = getNetworkInfo(toChainId).name

  return (
    <Row>
      <ColumnBridging>
        <TextBridging>
          {value} {assetName}
        </TextBridging>
      </ColumnBridging>
      <ColumnFrom>
        <TextFrom>
          <Link
            href={getExplorerLink(log[0].chainId, log[0].txHash, 'transaction')}
            rel="noopener noreferrer"
            target="_blank"
          >
            {fromChainName}
          </Link>
        </TextFrom>
      </ColumnFrom>
      <ColumnToFlex>
        <Filler>
          <Dots status={'confirmed'} />
          <Dots status={status} />
        </Filler>
        <TextTo
          status={status}
          href={log[1] && getExplorerLink(log[1].chainId, log[1].txHash, 'transaction')}
          rel="noopener noreferrer"
          target="_blank"
        >
          {toChainName}
        </TextTo>
      </ColumnToFlex>
      <ColumnStatus>
        <BridgeStatusTag status={status} pendingReason={pendingReason} onCollect={() => onCollect(tx)} />
      </ColumnStatus>
    </Row>
  )
}
