import React, { ReactNode } from 'react'
import styled from 'styled-components'

import Button from './Button'
import Card from './Card'
import CardIcon from '../../../components/CardIcon'
import IconLoader from '../../../components/IconLoader'
import Spacer from '../../../components/Spacer'
import CompoundIcon from '../../../assets/svg/logo_compound.svg'

import useHome from '../../../hooks/useHome'

import { Home } from '../../../contexts/home'
import { PageFields } from 'data/Reserves'

const StyledCardContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[4]}px;
`

const StyledCardAccent = styled.div`
  background: linear-gradient(
      45deg,
      rgb(255, 0, 0) 0%,
      rgb(255, 154, 0) 10%,
      rgb(208, 222, 33) 20%,
      rgb(79, 220, 74) 30%,
      rgb(63, 218, 216) 40%,
      rgb(47, 201, 226) 50%,
      rgb(28, 127, 238) 60%,
      rgb(95, 21, 242) 70%,
      rgb(186, 12, 248) 80%,
      rgb(251, 7, 217) 90%,
      rgb(255, 0, 0) 100%
    )
    0% 0% / 300% 300%;
  border-radius: 12px;
  filter: blur(6px);
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  z-index: -1;
  animation: 2s linear 0s infinite normal none running breath;
  @keyframes breath {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
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
  margin-bottom: ${({ theme }) => theme.spacing[4]}px;
  flex-flow: row wrap;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`

const StyledCardWrapper = styled.div`
  display: flex;
  width: calc((900px - ${({ theme }) => theme.spacing[4]}px * 2) / 3);
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

function CardContent({ children }: { children: ReactNode }) {
  return <StyledCardContent>{children}</StyledCardContent>
}

function DefiIcon({ name }: { name: string }) {
  const iconName = name.toLocaleLowerCase()

  switch (iconName) {
    case PageFields.COMPOUND:
      return <img width={'60px'} src={CompoundIcon} alt={iconName} />
    default:
      return <></>
  }
}

function HomeCard({ home }: { home: Home }) {
  return (
    <StyledCardWrapper>
      {!!home.highlight && <StyledCardAccent />}
      <Card>
        <CardContent>
          <StyledContent>
            <CardIcon>{home.icon ? home.icon : <DefiIcon name={home.name} />}</CardIcon>
            <StyledTitle>{home.name}</StyledTitle>
            <StyledDetails>
              <StyledDetail>{home.description}</StyledDetail>
            </StyledDetails>
            <Spacer />
            <Button to={`/${home.id}${home.home}`} text={'Enter'}></Button>
          </StyledContent>
        </CardContent>
      </Card>
    </StyledCardWrapper>
  )
}

export default function HomeCards() {
  const [homes] = useHome()
  const rows = homes.reduce<Home[][]>(
    (homeRows, home) => {
      const newHomeRows = [...homeRows]
      if (newHomeRows[newHomeRows.length - 1].length === 3) {
        newHomeRows.push([home])
      } else {
        newHomeRows[newHomeRows.length - 1].push(home)
      }
      return newHomeRows
    },
    [[]]
  )

  return (
    <StyledCards>
      {!!rows[0].length ? (
        rows.map((homeRow, i) => (
          <StyledRow key={i}>
            {homeRow.map((home, j) => (
              <React.Fragment key={j}>
                <HomeCard home={home} />
                {(j === 0 || j === 1) && <StyledSpacer />}
              </React.Fragment>
            ))}
          </StyledRow>
        ))
      ) : (
        <StyledLoadingWrapper>
          <IconLoader text="Loading Defi" />
        </StyledLoadingWrapper>
      )}
    </StyledCards>
  )
}
