import { ActivityEventResponse } from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { formatEthPrice } from 'nft/utils/currency'
import { getTimeDifference } from 'nft/utils/date'
import { putCommas } from 'nft/utils/putCommas'
import styled from 'styled-components/macro'

import { EventCell } from '../collection/ActivityCells'
import { MarketplaceIcon } from '../collection/ActivityCells'

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

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `opacity ${duration.medium} ${timing.ease}`};
`

const ActivityContainer = styled.div`
  max-height: 310px;
  overflow: auto;

  // Firefox scrollbar styling
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.backgroundOutline} transparent`};

  // safari and chrome scrollbar styling
  ::-webkit-scrollbar {
    background: transparent;
    width: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundOutline};
    border-radius: 8px;
  }
`

const AssetActivity = ({ eventsData }: { eventsData: ActivityEventResponse | undefined }) => {
  return (
    <ActivityContainer id="activityContainer">
      <Table>
        <thead>
          <TR>
            <TH>Event</TH>
            <TH>Price</TH>
            <TH>By</TH>
            <TH>To</TH>
            <TH>Time</TH>
          </TR>
        </thead>
        <tbody>
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
                      <Link
                        href={`https://etherscan.io/address/${fromAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shortenAddress(fromAddress, 2, 4)}
                      </Link>
                    )}
                  </TD>

                  <TD>
                    {toAddress && (
                      <Link
                        href={`https://etherscan.io/address/${toAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shortenAddress(toAddress, 2, 4)}
                      </Link>
                    )}
                  </TD>
                  <TD>{eventTimestamp && getTimeDifference(eventTimestamp.toString())}</TD>
                </TR>
              )
            })}
        </tbody>
      </Table>
    </ActivityContainer>
  )
}

export default AssetActivity
