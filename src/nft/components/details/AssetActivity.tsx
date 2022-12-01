import { OpacityHoverState, ScrollBarStyles } from 'components/Common'
import { LoadingBubble } from 'components/Tokens/loading'
import { EventCell, MarketplaceIcon } from 'nft/components/collection/ActivityCells'
import { ActivityEventResponse } from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { formatEthPrice } from 'nft/utils/currency'
import { getTimeDifference } from 'nft/utils/date'
import { putCommas } from 'nft/utils/putCommas'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'

const TR = styled.tr`
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  width: 100%;

  &:last-child {
    border-bottom: none;
  }
`

const TH = styled.th`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  width: 20%;

  @media (max-width: 960px) {
    &:nth-child(4) {
      display: none;
    }
  }

  @media (max-width: 720px) {
    &:nth-child(2) {
      display: none;
    }
  }
`

const Table = styled.table`
  border-collapse: collapse;
  text-align: left;
  width: 100%;
`

const TD = styled.td`
  height: 56px;
  padding: 8px 0px;
  text-align: left;
  vertical-align: middle;
  width: 20%;

  @media (max-width: 960px) {
    &:nth-child(4) {
      display: none;
    }
  }

  @media (max-width: 720px) {
    &:nth-child(2) {
      display: none;
    }
  }
`

const PriceContainer = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`

const Link = styled.a`
  color: ${({ theme }) => theme.textPrimary};
  text-decoration: none;

  ${OpacityHoverState}
`

const ActivityContainer = styled.div`
  max-height: 310px;
  overflow: auto;

  ${ScrollBarStyles}
`

const LoadingCell = styled(LoadingBubble)`
  height: 20px;
  width: 80px;
`

enum AssetActivityColumnHeader {
  Event = 'Event',
  Price = 'Price',
  By = 'By',
  To = 'To',
  Time = 'Time',
}

const ActivityTable = ({ children }: { children: ReactNode }) => {
  return (
    <ActivityContainer id="activityContainer">
      <Table>
        <thead>
          <TR>
            <TH>{AssetActivityColumnHeader.Event}</TH>
            <TH>{AssetActivityColumnHeader.Price}</TH>
            <TH>{AssetActivityColumnHeader.By}</TH>
            <TH>{AssetActivityColumnHeader.To}</TH>
            <TH>{AssetActivityColumnHeader.Time}</TH>
          </TR>
        </thead>
        <tbody>{children}</tbody>
      </Table>
    </ActivityContainer>
  )
}

const LoadingAssetActivityRow = () => {
  return (
    <TR>
      <TD>
        <LoadingCell />
      </TD>
      <TD>
        <LoadingCell />
      </TD>
      <TD>
        <LoadingCell />
      </TD>
      <TD>
        <LoadingCell />
      </TD>
      <TD>
        <LoadingCell />
      </TD>
    </TR>
  )
}

export const LoadingAssetActivity = ({ rowCount }: { rowCount: number }) => {
  return (
    <ActivityTable>
      {Array(rowCount)
        .fill(null)
        .map((_, index) => {
          return <LoadingAssetActivityRow key={index} />
        })}
    </ActivityTable>
  )
}

const AssetActivity = ({ eventsData }: { eventsData: ActivityEventResponse | undefined }) => {
  return (
    <ActivityTable>
      {eventsData?.events &&
        eventsData.events.map((event, index) => {
          const { eventTimestamp, eventType, fromAddress, marketplace, price, toAddress, transactionHash } = event
          const formattedPrice = price ? putCommas(formatEthPrice(price)).toString() : null

          return (
            <TR key={index}>
              <TD>
                <EventCell
                  eventType={eventType}
                  eventTimestamp={eventTimestamp}
                  eventTransactionHash={transactionHash}
                  eventOnly
                />
              </TD>
              <TD>
                {formattedPrice && (
                  <PriceContainer>
                    {marketplace && <MarketplaceIcon marketplace={marketplace} />}
                    {formattedPrice} ETH
                  </PriceContainer>
                )}
              </TD>

              <TD>
                {fromAddress && (
                  <Link href={`https://etherscan.io/address/${fromAddress}`} target="_blank" rel="noopener noreferrer">
                    {shortenAddress(fromAddress, 2, 4)}
                  </Link>
                )}
              </TD>

              <TD>
                {toAddress && (
                  <Link href={`https://etherscan.io/address/${toAddress}`} target="_blank" rel="noopener noreferrer">
                    {shortenAddress(toAddress, 2, 4)}
                  </Link>
                )}
              </TD>
              <TD>{eventTimestamp && getTimeDifference(eventTimestamp.toString())}</TD>
            </TR>
          )
        })}
    </ActivityTable>
  )
}

export default AssetActivity
