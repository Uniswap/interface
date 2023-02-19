//import { Trans } from '@lingui/macro'
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

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 12px;
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

interface PoolPositionListItemProps {
  positionDetails: PoolPositionDetails
}

export default function PoolPositionListItem({ positionDetails }: PoolPositionListItemProps) {
  const { pool, name, symbol } = positionDetails

  // TODO: get some pool data like, all data with 1 call. Only problem this call will be made for each pool
  // therefore must first restrict pools by owner
  // const poolData = usePoolData(pool)

  //const position = useMemo(() => {
  //  return new PoolPosition({ name, symbol, pool, id })
  //}, [name, symbol, pool, id])

  const positionSummaryLink = '/create/' + positionDetails.pool

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          <DataText>&nbsp;{name}&nbsp;</DataText>
        </PrimaryPositionIdData>
        <DataText>&nbsp;{symbol}&nbsp;</DataText>
      </RowBetween>
    </LinkRow>
  )
}
