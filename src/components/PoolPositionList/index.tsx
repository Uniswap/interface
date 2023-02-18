import { Trans } from '@lingui/macro'
import PoolPositionListItem from 'components/PoolPositionListItem'
import React from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PoolPositionDetails } from 'types/position'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    align-items: center;
    display: flex;
    justify-content: space-between;
    & > div:last-child {
      text-align: right;
      margin-right: 12px;
    }
  }
`

const MobileHeader = styled.div`
  font-weight: medium;
  padding: 8px;
  font-weight: 500;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    display: none;
  }

  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`

type PoolPositionListProps = React.PropsWithChildren<{
  positions: PoolPositionDetails[]
  filterByOperator?: any
  filterByHolder?: string
}>

export default function PoolPositionList({ positions, filterByOperator, filterByHolder }: PoolPositionListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>Your pools</Trans>
          {positions && ' (' + positions.length + ')'}
        </div>
      </DesktopHeader>
      <MobileHeader>
        <Trans>Your pools</Trans>
      </MobileHeader>
      {positions.map((p) => {
        return <PoolPositionListItem key={p.id.toString()} positionDetails={p} />
      })}
    </>
  )
}
