import { Trans } from 'i18n'
import React from 'react'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'
import PositionListItem from './PositionListItem'

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

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
  stakedPositons: PositionDetails[]
  onWithdraw: any
  onDeposit: any
}>

export default function PositionList({ positions, stakedPositons, onWithdraw, onDeposit }: PositionListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>Your positions</Trans>
          {positions && ' (' + (positions.length + stakedPositons.length) + ')'}
        </div>
      </DesktopHeader>
      <MobileHeader>
        <Trans>Your positions</Trans>
      </MobileHeader>
      {positions.map((p) => (
        <PositionListItem
          key={p.tokenId.toString()}
          {...p}
          isStaked={false}
          onWithdraw={onWithdraw}
          onDeposit={onDeposit}
        />
      ))}
      {stakedPositons.map((p) => (
        <PositionListItem
          key={p.tokenId.toString()}
          {...p}
          isStaked={true}
          onWithdraw={onWithdraw}
          onDeposit={onDeposit}
        />
      ))}
    </>
  )
}
