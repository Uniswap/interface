import PositionListItem from 'components/PositionListItem'
import styled from 'lib/styled-components'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

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
  positions: PositionDetails[]
  setUserHideClosedPositions: any
  userHideClosedPositions: boolean
}>

export default function PositionList({
  positions,
  setUserHideClosedPositions,
  userHideClosedPositions,
}: PositionListProps) {
  const { t } = useTranslation()
  return (
    <>
      <DesktopHeader>
        <div>
          {t('pool.positions.title')}
          {positions && ' (' + positions.length + ')'}
        </div>

        <ToggleLabel
          id="desktop-hide-closed-positions"
          onClick={() => {
            setUserHideClosedPositions(!userHideClosedPositions)
          }}
        >
          {userHideClosedPositions ? t('pool.showClosed') : t('pool.hideClosed')}
        </ToggleLabel>
      </DesktopHeader>
      <MobileHeader>
        {t('pool.positions.title')}
        <ToggleWrap>
          <ToggleLabel
            onClick={() => {
              setUserHideClosedPositions(!userHideClosedPositions)
            }}
          >
            {userHideClosedPositions ? t('pool.showClosed') : t('pool.hideClosed')}
          </ToggleLabel>
        </ToggleWrap>
      </MobileHeader>
      {positions.map((p) => (
        <PositionListItem key={p.tokenId.toString()} {...p} />
      ))}
    </>
  )
}
