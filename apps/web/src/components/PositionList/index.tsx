import PositionListItem from 'components/PositionListItem'
import StakingPositionListItem from 'components/StakingPositionListItem'
import { Trans } from 'i18n'
import React from 'react'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import { PositionWithIncentive, ProcessedIncentive, UserPosition } from 'hooks/useIncentivesData'
import { PositionsResponse } from 'hooks/useTotalPositions'
import { BigNumber } from '@ethersproject/bignumber'

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
  positions: PositionDetails[] | PositionWithIncentive[]
  setUserHideClosedPositions?: (value: boolean) => void
  userHideClosedPositions?: boolean
  isStakingList?: boolean
}>

function isStakingPosition(position: PositionDetails |  PositionWithIncentive): position is PositionWithIncentive {
  return 'id' in position && 'minter' in position && 'owner' in position && 'pool' in position
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
      {positions.map((p, i) => {
        if (isStakingPosition(p)) {
          return <StakingPositionListItem key={i} position={p} />
        } else {
          return (
            <PositionListItem
              key={p.tokenId.toString()}
              token0={p.token0}
              token1={p.token1}
              tokenId={p.tokenId}
              fee={p.fee}
              liquidity={p.liquidity}
              tickLower={p.tickLower}
              tickUpper={p.tickUpper}
            />
          )
        }
      })}
    </>
  )
}
