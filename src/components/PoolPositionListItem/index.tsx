import { Trans } from '@lingui/macro'
//import Badge from 'components/Badge'
//import RangeBadge from 'components/Badge/RangeBadge'
//import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
//import { useToken } from 'hooks/Tokens'
//import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PoolPositionDetails } from 'types/position'

const LinkRow = styled(Link)`
  align-items: center;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.deprecated_text1};
  padding: 16px;
  text-decoration: none;
  font-weight: 500;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 600;
  font-size: 18px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 18px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  width: 100%;
`

const RangeText = styled.span`
  padding: 0.25rem 0.25rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.deprecated_text3};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

interface PoolPositionListItemProps {
  positionDetails: PoolPositionDetails
  returnPage: string
}

export default function PoolPositionListItem({ positionDetails, returnPage }: PoolPositionListItemProps) {
  const { name, symbol } = positionDetails

  // TODO: get some pool data like, all data with 1 call. Only problem this call will be made for each pool
  // therefore must first restrict pools by owner
  // const poolData = usePoolData(pool)

  //const position = useMemo(() => {
  //  return new PoolPosition({ name, symbol, pool, id })
  //}, [name, symbol, pool, id])

  //const positionSummaryLink = '/smart-pool/' + positionDetails.pool '/' + positionDetails.id
  const positionSummaryLink = `/smart-pool/${positionDetails.address}/${returnPage}` ///${positionDetails.id}

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          <DataText>{name}</DataText>
        </PrimaryPositionIdData>
        <DataText>{symbol}</DataText>
      </RowBetween>
      <RangeLineItem>
        <RangeText>
          <ExtentsText>
            <Trans>{positionDetails.address}</Trans>
          </ExtentsText>
        </RangeText>
      </RangeLineItem>
    </LinkRow>
  )
}
