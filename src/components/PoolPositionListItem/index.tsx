import { Trans } from '@lingui/macro'
//import Badge from 'components/Badge'
import { ButtonPrimary } from 'components/Button'
import RaceModal from 'components/earn/RaceModal'
//import RangeBadge from 'components/Badge/RangeBadge'
//import Loader from 'components/Loader'
import Row, { RowBetween, RowFixed } from 'components/Row'
//import { useToken } from 'hooks/Tokens'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { PoolPositionDetails } from 'types/position'

const LinkRow = styled(Link)`
  align-items: center;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  padding: 16px;
  text-decoration: none;
  font-weight: 500;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const DataText = styled.div`
  font-weight: 600;
  font-size: 18px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 18px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  width: 100%;
`

const RangeText = styled.span`
  padding: 0.25rem 0.25rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

const LabelText = styled.div<{ color: string }>`
  align-items: center;
  color: ${({ color }) => color};
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  margin-right: 4px;
`

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.accentSuccess};
  border-radius: 50%;
  height: 8px;
  width: 8px;
`

interface PoolPositionListItemProps {
  positionDetails: PoolPositionDetails
  returnPage: string
}

export default function PoolPositionListItem({ positionDetails, returnPage }: PoolPositionListItemProps) {
  const theme = useTheme()
  const { name, apr, irr, userHasStake, poolDelegatedStake, poolOwnStake, userBalance, userIsOwner } = positionDetails

  //const position = useMemo(() => {
  //  return new PoolPosition({ name, symbol, pool, id })
  //}, [name, symbol, pool, id])

  //const positionSummaryLink = '/smart-pool/' + positionDetails.pool '/' + positionDetails.id
  // TODO: also add poolOwnStake to url and che if adding ''/'' to mint page is ok
  const poolStake = poolDelegatedStake ? (Number(poolDelegatedStake) / 1e18).toFixed(0) : ''
  const aprToString = apr ? (Number(apr) * 100).toFixed(2) : ''
  const poolOwnStakeString = poolOwnStake ? (Number(poolOwnStake) / 1e18).toFixed(0) : ''
  const irrToString = irr ? (Number(irr) * 100).toFixed(2) : ''
  const positionSummaryLink = poolStake
    ? `/smart-pool/${positionDetails.address}/${returnPage}/${poolStake}/${aprToString}/${poolOwnStakeString}/${irrToString}`
    : `/smart-pool/${positionDetails.address}/${returnPage}` ///${positionDetails.id}

  const [showRaceModal, setShowRaceModal] = useState<boolean>(false)

  const onButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setShowRaceModal(true)
    },
    [setShowRaceModal]
  )

  return (
    <>
      <RaceModal
        isOpen={showRaceModal}
        poolAddress={positionDetails.address}
        onDismiss={() => setShowRaceModal(false)}
        title={<Trans>Race Smart Pool</Trans>}
      />
      <LinkRow to={positionSummaryLink}>
        <RowBetween>
          <PrimaryPositionIdData>
            <Row gap="sm" justify="flex-end">
              <DataText>{name}</DataText>
              {userHasStake && (
                <LabelText color={theme.accentSuccess}>
                  <BadgeText>
                    <Trans>active</Trans>
                  </BadgeText>
                  <ActiveDot />
                </LabelText>
              )}
              {returnPage === 'mint' && Number(userBalance) > 0 && (
                <LabelText color={theme.accentSuccess}>
                  <BadgeText>
                    <Trans>held</Trans>
                  </BadgeText>
                  <ActiveDot />
                </LabelText>
              )}
              {returnPage === 'mint' && userIsOwner && (
                <LabelText color={theme.accentSuccess}>
                  <BadgeText>
                    <Trans>owned</Trans>
                  </BadgeText>
                  <ActiveDot />
                </LabelText>
              )}
            </Row>
          </PrimaryPositionIdData>
          {returnPage === 'mint' ? (
            <RowFixed gap="24px" style={{ marginRight: '4px', marginTop: '4px' }}>
              <ButtonPrimary
                style={{ width: 'fit-content', height: '40px' }}
                padding="8px"
                $borderRadius="8px"
                onClick={onButtonClick}
              >
                <Trans>Race</Trans>
              </ButtonPrimary>
            </RowFixed>
          ) : (
            <RowFixed style={{ gap: '24px', marginRight: '8px' }}>
              <DataText>{(Number(irr) * 100).toFixed(1)}%</DataText>
              <DataText style={{ minWidth: '50px' }}>{(Number(apr) * 100).toFixed(1)}%</DataText>
            </RowFixed>
          )}
        </RowBetween>
        <RangeLineItem>
          <RangeText>
            <ExtentsText>
              <Trans>{positionDetails.address}</Trans>
            </ExtentsText>
          </RangeText>
        </RangeLineItem>
      </LinkRow>
    </>
  )
}
