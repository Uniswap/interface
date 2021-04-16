import PositionListItem from 'components/PositionListItem'
import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

const DesktopHeader = styled.div`
  display: none;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.6;
  padding: 8px 8px 0 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    align-items: center;
    display: flex;
    margin: 0 0 8px 0;
    & > div:first-child {
      flex: 1 1 auto;
    }
    & > div:not(:first-child) {
      text-align: right;
      min-width: 18%;
    }
  }
`

const MobileHeader = styled.div`
  font-weight: medium;
  font-size: 16px;
  margin-bottom: 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: none;
  }
`

export type PositionListProps = React.PropsWithChildren<{
  positions: PositionDetails[]
}>

export default function PositionList({ positions }: PositionListProps) {
  const { t } = useTranslation()

  return (
    <>
      <DesktopHeader>
        <div>{t('Position')}</div>
        <div>{t('Range')}</div>
        <div>{t('Liquidity')}</div>
        <div>{t('Fees Earned')}</div>
      </DesktopHeader>
      <MobileHeader>Your positions</MobileHeader>
      {positions.map((p, i) => {
        const key = `${i}-${p.nonce.toString()} ${p.token0} ${p.token1} ${p.tokensOwed0} ${p.tokensOwed1}`
        return <PositionListItem key={key} positionDetails={p} positionIndex={i} />
      })}
    </>
  )
}
