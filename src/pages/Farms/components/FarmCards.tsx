/* eslint-disable react/prop-types */
import React from 'react'
import styled from 'styled-components'

import Button from './Button'
import Card from './Card'
import CardIcon from './CardIcon'
import Loader from './Loader'
import Spacer from './Spacer'

import useFarms from '../../../hooks/useFarms'

import { Farm } from '../../../contexts/Farms'

const FarmCards: React.FC = () => {
  const [farms] = useFarms()
  const rows = farms.reduce<Farm[][]>(
    (farmRows, farm) => {
      const newFarmRows = [...farmRows]
      if (newFarmRows[newFarmRows.length - 1].length === 3) {
        newFarmRows.push([farm])
      } else {
        newFarmRows[newFarmRows.length - 1].push(farm)
      }
      return newFarmRows
    },
    [[]]
  )

  return (
    <StyledCards>
      {!!rows[0].length ? (
        rows.map((farmRow, i) => (
          <StyledRow key={i}>
            {farmRow.map((farm, j) => (
              <React.Fragment key={j}>
                <FarmCard farm={farm} />
                {(j === 0 || j === 1) && <StyledSpacer />}
              </React.Fragment>
            ))}
          </StyledRow>
        ))
      ) : (
        <StyledLoadingWrapper>
          <Loader text="Loading farms" />
        </StyledLoadingWrapper>
      )}
    </StyledCards>
  )
}

interface FarmCardProps {
  farm: Farm
}

const FarmCard: React.FC<FarmCardProps> = ({ farm }) => {
  return (
    <StyledCardWrapper>
      {!!farm.highlight && <StyledCardAccent />}
      <Card>
        <CardContent>
          <StyledContent>
            <CardIcon>{farm.icon}</CardIcon>
            <StyledTitle>{farm.name}</StyledTitle>
            <StyledDetails>
              <StyledDetail>Deposit BTC</StyledDetail>
              <StyledDetail>Earn YAM</StyledDetail>
            </StyledDetails>
            <Spacer />
            <Button to={`/${farm.id}${farm.home}`} text={'Select'}></Button>
          </StyledContent>
        </CardContent>
      </Card>
    </StyledCardWrapper>
  )
}

// eslint-disable-next-line react/prop-types
const CardContent: React.FC = ({ children }) => <StyledCardContent>{children}</StyledCardContent>

const StyledCardContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: ${props => props.theme.spacing[4]}px;
`

const StyledCardAccent = styled.div`
  background: linear-gradient(
    45deg,
    rgba(255, 0, 0, 1) 0%,
    rgba(255, 154, 0, 1) 10%,
    rgba(208, 222, 33, 1) 20%,
    rgba(79, 220, 74, 1) 30%,
    rgba(63, 218, 216, 1) 40%,
    rgba(47, 201, 226, 1) 50%,
    rgba(28, 127, 238, 1) 60%,
    rgba(95, 21, 242, 1) 70%,
    rgba(186, 12, 248, 1) 80%,
    rgba(251, 7, 217, 1) 90%,
    rgba(255, 0, 0, 1) 100%
  );
  border-radius: 12px;
  filter: blur(4px);
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  z-index: -1;
`

const StyledCards = styled.div`
  width: 900px;
  @media (max-width: 768px) {
    width: 100%;
  }
`

const StyledLoadingWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
`

const StyledRow = styled.div`
  display: flex;
  margin-bottom: ${props => props.theme.spacing[4]}px;
  flex-flow: row wrap;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`

const StyledCardWrapper = styled.div`
  display: flex;
  width: calc((900px - ${props => props.theme.spacing[4]}px * 2) / 3);
  position: relative;
`

const StyledTitle = styled.h4`
  color: ${({ theme }) => theme.grey600};
  font-size: 24px;
  font-weight: 700;
  margin: ${({ theme }) => theme.spacing[2]}px 0 0;
  padding: 0;
`

const StyledContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const StyledSpacer = styled.div`
  height: ${({ theme }) => theme.spacing[4]}px;
  width: ${({ theme }) => theme.spacing[4]}px;
`

const StyledDetails = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]}px;
  text-align: center;
`

const StyledDetail = styled.div`
  color: ${({ theme }) => theme.grey500};
`

export default FarmCards
