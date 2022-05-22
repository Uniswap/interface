import { Trans } from '@lingui/macro'
import PositionListItem from 'components/PositionListItem'
import SimpleToggle from 'components/Toggle/SimpleToggle'
import React from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
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
  font-size: 16px;
  font-weight: 500;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: none;
  }

  @media screen and (max-width: ${MEDIA_WIDTHS.upToExtraSmall}px) {
    display: flex;
    flex-direction: column;
    align-items: start;
  }
`

const ToggleWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const ToggleLabelWrap = styled.div`
  opacity: 0.6;
  margin-right: 10px;
`

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
  setUserHideClosedPositions: any
  userHideClosedPositions: boolean
}>

export default function PositionList({
  positions,
  setUserHideClosedPositions,
  userHideClosedPositions,
}: PositionListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>Your positions</Trans>
          {positions && ' (' + positions.length + ')'}
        </div>
        <ToggleWrap>
          <ToggleLabelWrap>
            <Trans>Show closed positions</Trans>
          </ToggleLabelWrap>
          <SimpleToggle
            id="desktop-hide-closed-positions"
            isActive={!userHideClosedPositions}
            toggle={() => {
              setUserHideClosedPositions(!userHideClosedPositions)
            }}
          />
        </ToggleWrap>
      </DesktopHeader>
      <MobileHeader>
        <Trans>Your positions</Trans>
        <ToggleWrap>
          <ToggleLabelWrap>
            <Trans>Show closed positions</Trans>
          </ToggleLabelWrap>
          <SimpleToggle
            id="mobile-hide-closed-positions"
            isActive={!userHideClosedPositions}
            toggle={() => {
              setUserHideClosedPositions(!userHideClosedPositions)
            }}
          />
        </ToggleWrap>
      </MobileHeader>
      {positions.map((p) => {
        return <PositionListItem key={p.tokenId.toString()} positionDetails={p} />
      })}
    </>
  )
}
