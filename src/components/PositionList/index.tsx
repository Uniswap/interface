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
  padding: 8px;

  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    align-items: center;
    display: flex;

    display: grid;
    grid-template-columns: 1fr 1fr;
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
        <div>
          {t('Your positions')}
          {positions && ' (' + positions.length + ')'}
        </div>
        <div>{t('Price range')}</div>
      </DesktopHeader>
      <MobileHeader>Your positions</MobileHeader>
      {positions.map((p) => {
        return <PositionListItem key={p.tokenId.toString()} positionDetails={p} />
      })}
    </>
  )
}
