import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import PositionListItem from 'components/PositionListItem'
import React, { useState } from 'react'
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

    grid-template-columns: 1fr 1fr;
    & > div:last-child {
      text-align: right;
      margin-right: 12px;
    }
  }
`

const MobileHeader = styled.div`
  font-size: 16px;
  font-weight: 500;
  padding: 8px;
  display: flex;
  justify-content: space-between;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: none;
  }
`

type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
  fundingBalance?: CurrencyAmount<Token>
  minBalance?: CurrencyAmount<Token>
}>

export default function PositionList({ positions, fundingBalance, minBalance }: PositionListProps) {
  const isUnderfunded = fundingBalance ? !minBalance?.lessThan(fundingBalance?.quotient) : true
  const [filterProcessed, setFilterProcessed] = useState(false)

  const handleChange = () => {
    setFilterProcessed(!filterProcessed)
  }

  return (
    <>
      <DesktopHeader>
        <div>
          <Trans>My limit orders</Trans>
          {positions && ' (' + positions.length + ')'}
        </div>
        <div>
          <input
            type="checkbox"
            style={{ outline: 'blue' }}
            onChange={handleChange}
            defaultChecked
            checked={filterProcessed}
          />
          <span>Filter processed limit orders </span>
        </div>
        <div>
          <Trans>Status</Trans>
        </div>
      </DesktopHeader>
      <MobileHeader>
        <div>
          {' '}
          <Trans>My limit orders</Trans>
        </div>
        <div>
          Filter processed limit orders
          <input type="checkbox" checked={filterProcessed} onChange={handleChange} />
        </div>
      </MobileHeader>
      {positions.map((p) => {
        if (!filterProcessed || !p.processed)
          return <PositionListItem key={p.tokenId.toString()} positionDetails={p} isUnderfunded={isUnderfunded} />
        return
      })}
    </>
  )
}
