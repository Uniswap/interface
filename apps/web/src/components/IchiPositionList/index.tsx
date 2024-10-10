import { IchiVault, UserAmountsInVault } from '@ichidao/ichi-vaults-sdk'
import { Trans } from 'i18n'
import React from 'react'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import IchiPositionListItem from './IchiPositionListItem'

type IchiPositionInfo = UserAmountsInVault & { vaultInfo: IchiVault }

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
  positions: IchiPositionInfo[]
}>

export default function PositionList({ positions }: PositionListProps) {
  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>Your single sided deposits</Trans>
          {positions && ' (' + positions.length + ')'}
        </div>
      </DesktopHeader>
      <MobileHeader>
        <Trans>Your positions</Trans>
      </MobileHeader>
      {positions.map((p) => (
        <IchiPositionListItem
          key={p.vaultAddress.toString()}
          token0={p.vaultInfo.tokenA}
          token1={p.vaultInfo.tokenB}
          vaultAddress={p.vaultAddress}
          amounts={p.userAmounts}
        />
      ))}
    </>
  )
}
