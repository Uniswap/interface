import PositionListItem from 'components/PositionListItem'
import { Trans } from 'i18n'
import React from 'react'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import { UserPosition } from 'hooks/useIncentivesData'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};

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
  font-weight: 535;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    display: none;
  }

  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`

const ToggleWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const ToggleLabel = styled.button`
  cursor: pointer;
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.accent1};
  font-size: 14px;
  font-weight: 485;
`

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[] | UserPosition[]
  setUserHideClosedPositions?: (value: boolean) => void
  userHideClosedPositions?: boolean
  isStakingList?: boolean
}>

function isStakingPosition(position: PositionDetails | UserPosition): position is UserPosition {
  return 'isStakingPosition' in position
}

export default function PositionList({
  positions,
  setUserHideClosedPositions,
  userHideClosedPositions,
  isStakingList = false,
}: PositionListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans i18nKey={isStakingList ? "pool.stakingPositions" : "pool.position"} />
          {positions && ' (' + positions.length + ')'}
        </div>

        {!isStakingList && setUserHideClosedPositions && (
          <ToggleLabel
            id="desktop-hide-closed-positions"
            onClick={() => {
              setUserHideClosedPositions(!userHideClosedPositions)
            }}
          >
            {userHideClosedPositions ? <Trans i18nKey="pool.showClosed" /> : <Trans i18nKey="pool.hideClosed" />}
          </ToggleLabel>
        )}
      </DesktopHeader>
      <MobileHeader>
        <Trans i18nKey={isStakingList ? "pool.stakingPositions" : "pool.position"} />
        {!isStakingList && setUserHideClosedPositions && (
          <ToggleWrap>
            <ToggleLabel
              onClick={() => {
                setUserHideClosedPositions(!userHideClosedPositions)
              }}
            >
              {userHideClosedPositions ? <Trans i18nKey="pool.showClosed" /> : <Trans i18nKey="pool.hideClosed" />}
            </ToggleLabel>
          </ToggleWrap>
        )}
      </MobileHeader>
      {positions.map((p) => (
        <PositionListItem 
          key={isStakingPosition(p) ? p.id.toString() : p.tokenId.toString()} 
          {...p} 
          isStakingPosition={isStakingList} 
        />
      ))}
    </>
  )
}
