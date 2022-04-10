import React from 'react'
import styled, { DefaultTheme } from 'styled-components'
import { PotionIcon2 } from '../Potions/Potions'

const FarmHeadingContainer = styled.div`
  max-width: 1080px;
  width: 100%;
  margin-top: 1%;
  //margin-bottom: 2%;

  padding: 20px;
`

const HeadingText = styled.h1`
  font-size: 2.5rem;
  display: inline-block;
  justify-content: center;
  align-items: center;
  margin: 0;
`
const HeaderTextLine = styled.div`
  display: flex;
  align-items: center;
`

const DescriptionText = styled.p`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.text2};
  margin-bottom: 2%;
`

export const FarmHeading = () => {
  return (
    <FarmHeadingContainer>
      <HeaderTextLine>
        <PotionIcon2 width={60} height={60} />
        <HeadingText>Farm</HeadingText>
      </HeaderTextLine>
      <DescriptionText>Earn fees and rewards by depositing and staking your LP tokens.</DescriptionText>
      {/*<HR />*/}
    </FarmHeadingContainer>
  )
}
