import { ActivityEventResponse } from 'nft/types'
import styled from 'styled-components/macro'
import { shortenAddress } from 'nft/utils/address'
import { EventCell } from '../collection/ActivityCells'
import { getTimeDifference } from 'nft/utils/date'
import { formatEthPrice } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { MarketplaceIcon } from '../collection/ActivityCells'

const TR = styled.tr`
  width: 100%;
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  &:nth-child(1) {
    border-bottom: none;
  }
`

const TH = styled.th`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  width: 20%;
`

const Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`

const TD = styled.td`
  width: 20%;
  text-align: left;
  padding-top: 16px;
  padding-bottom: 16px;
`

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Link = styled.a`
  color: ${({ theme }) => theme.textPrimary};
  text-decoration: none;
`

const AssetActivity = ({ eventsData }: { eventsData: ActivityEventResponse | undefined }) => {
  const events = eventsData === undefined ? [] : eventsData?.events
  const { explorer } = getChainInfoOrDefault(SupportedChainId.MAINNET)

  return (
    <div>
      <Table>
        <TR>
          <TH>Event</TH>
          <TH>Price</TH>
          <TH>By</TH>
          <TH>To</TH>
          <TH>Time</TH>
        </TR>
        {events.map((event, index) => {
          const price = event.price
          const formattedPrice = price ? putCommas(formatEthPrice(price)).toString() : null
          const marketplace = event.marketplace

          return (
            <TR key={index}>
              <TD>
                <EventCell
                  eventType={event.eventType}
                  eventTimestamp={event.eventTimestamp}
                  eventTransactionHash={event.transactionHash}
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
              <Link href={`${explorer}/address/${event.fromAddress}`} target="_blank">
                <TD>{shortenAddress(event.fromAddress, 2, 4)}</TD>
              </Link>{' '}
              <TD>{event.toAddress && shortenAddress(event.toAddress)}</TD>
              <TD>{event.eventTimestamp && getTimeDifference(event.eventTimestamp.toString())}</TD>
            </TR>
          )
        })}
      </Table>
    </div>
  )
}

export default AssetActivity
