import { Trans } from '@lingui/macro'
import PositionListItem from 'components/PositionListItem'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import React from 'react'
import styled, { css } from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

const DesktopHeader = styled.div<{ redesignFlag: boolean }>`
  display: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;

  ${({ redesignFlag }) =>
    redesignFlag &&
    css`
      padding: 16px;
      border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
    `}

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

const MobileHeader = styled.div<{ redesignFlag: boolean }>`
  font-weight: medium;
  padding: 8px;
  font-weight: 500;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${({ redesignFlag }) =>
    redesignFlag &&
    css`
      padding: 16px;
      border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
    `}

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
  color: ${({ theme }) => theme.accentAction};
`

const MobileTogglePosition = styled.div`
  @media screen and (max-width: ${MEDIA_WIDTHS.deprecated_upToExtraSmall}px) {
    position: absolute;
    right: 20px;
  }
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
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled

  return (
    <>
      <DesktopHeader redesignFlag={redesignFlagEnabled}>
        <div>
          <Trans>Your positions</Trans>
          {positions && ' (' + positions.length + ')'}
        </div>

        <ToggleLabel
          id="desktop-hide-closed-positions"
          onClick={() => {
            setUserHideClosedPositions(!userHideClosedPositions)
          }}
        >
          {userHideClosedPositions ? <Trans>Show closed positions</Trans> : <Trans>Hide closed positions</Trans>}
        </ToggleLabel>
      </DesktopHeader>
      <MobileHeader redesignFlag={redesignFlagEnabled}>
        <Trans>Your positions</Trans>
        <ToggleWrap>
          <ToggleLabel>
            {userHideClosedPositions ? <Trans>Show closed positions</Trans> : <Trans>Hide closed positions</Trans>}
          </ToggleLabel>
        </ToggleWrap>
      </MobileHeader>
      {positions.map((p) => {
        return <PositionListItem key={p.tokenId.toString()} positionDetails={p} />
      })}
    </>
  )
}
