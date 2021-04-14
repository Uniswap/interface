import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { useTranslation } from 'react-i18next'

import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Farm } from 'state/types'
import { formattedNum, shortenAddress } from 'utils'
import { useFarmClaimModalToggle, useFarmStakeModalToggle } from 'state/application/hooks'
import { ButtonPrimary } from 'components/Button'

const TableRow = styled.div<{ fade?: boolean; isExpanded?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 1fr 1fr;
  grid-template-areas: 'pools liq apy amp end_in earnings balance';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.bg15};
  border: 1px solid transparent;
  border-bottom: 1px solid ${({ theme, isExpanded }) => (isExpanded ? 'transparent' : theme.advancedBorder)};

  &:hover {
    cursor: pointer;
  }
`

const ExpandedSection = styled.div`
  background-color: ${({ theme }) => theme.bg15};
  padding: 0 36px;
`

const ExpandedContent = styled.div`
  border-radius: 10px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;
  font-weight: 500;
  padding: 16px 24px;
`

const StakeGroup = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 2fr 2fr 1fr;
  grid-template-areas: 'stake unstake harvest';
  margin-bottom: 32px;
`

const GreyText = styled.div`
  color: ${({ theme }) => theme.primaryText2};
  margin-bottom: 8px;
`

const LPInfoContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`

const LPInfo = styled.div`
  margin-right: 40px;
`

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 20px;
  `}
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
}

export const ItemCard = ({ farm }: ListItemProps) => {
  return (
    <div>
      <StyledItemCard>{farm.lpAddress}</StyledItemCard>
    </div>
  )
}

const ListItem = ({ farm }: ListItemProps) => {
  const { t } = useTranslation()
  const [expand, setExpand] = useState<boolean>(false)
  const toggleFarmClaimModal = useFarmClaimModalToggle()
  const toggleFarmStakeModal = useFarmStakeModalToggle()

  const amp = farm.amp / 10000

  const handleClickHarvest = () => {
    toggleFarmClaimModal()
  }

  const handleClickStake = () => {
    toggleFarmStakeModal()
  }

  return (
    <>
      <TableRow isExpanded={expand} onClick={() => setExpand(!expand)}>
        <DataText grid-area="pools">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {amp === 1 ? (
              <>
                <DoubleCurrencyLogo currency0={farm.token} currency1={farm.quoteToken} size={16} margin={true} />
                <span>
                  {farm.token?.symbol} - {farm.quoteToken?.symbol}
                </span>
              </>
            ) : (
              <div />
            )}
          </div>
        </DataText>
        <DataText grid-area="liq">{formattedNum(farm.reserveUSD, true)}</DataText>
        <DataText grid-area="apy" style={{ color: 'rgba(137, 255, 120, 0.67)' }}>
          24.5%
        </DataText>
        <DataText grid-area="amp">{amp}</DataText>
        <DataText grid-area="end_in">15d 3hr 5m</DataText>
        <DataText grid-area="earnings">{farm.userData?.earnings || '320 KNC'}</DataText>
        <DataText grid-area="balance">
          {farm.userData?.tokenBalance || `280 LP ${farm.token?.symbol}-${farm.quoteToken?.symbol}`}
        </DataText>
      </TableRow>

      {expand && (
        <ExpandedSection>
          <ExpandedContent>
            <StakeGroup style={{ marginBottom: '14px' }}>
              <div grid-area="stake">
                <GreyText>
                  Balance: 280 {farm.token?.symbol}-{farm.quoteToken?.symbol} LP
                </GreyText>
              </div>
              <div grid-area="unstake">
                <GreyText>
                  Deposit: 280 {farm.token?.symbol}-{farm.quoteToken?.symbol} LP
                </GreyText>
              </div>
              <div grid-area="harvest">
                <GreyText>KNC Reward</GreyText>
                <div>320 KNC</div>
                <div>$940</div>
              </div>
            </StakeGroup>
            <StakeGroup>
              <div grid-area="stake">
                <ButtonPrimary padding="12px" onClick={handleClickStake}>
                  Stake
                </ButtonPrimary>
              </div>
              <div grid-area="unstake">
                <ButtonPrimary padding="12px" onClick={handleClickStake}>
                  Unstake
                </ButtonPrimary>
              </div>
              <div grid-area="harvest">
                <ButtonPrimary padding="12px" onClick={handleClickHarvest}>
                  Harvest
                </ButtonPrimary>
              </div>
            </StakeGroup>
            <LPInfoContainer>
              <LPInfo>
                <div>ADDRESS</div>
                <div>{shortenAddress(farm.lpAddress)}</div>
              </LPInfo>
              <div>
                <Link to={`/add/${farm.token?.address}/${farm.quoteToken?.address}/${farm.lpAddress}`}>
                  Get {farm.token?.symbol}-{farm.quoteToken?.symbol} LP ↗
                </Link>
              </div>
            </LPInfoContainer>
          </ExpandedContent>
        </ExpandedSection>
      )}
    </>
  )
}

export default ListItem
