import React from 'react'
import styled, { keyframes } from 'styled-components'
import { Flex } from 'rebass'
import Divider from 'components/Divider'

const shine = keyframes`
  to {
    background-position-x: -200%;
  }
`

const StyledPositionCard = styled.div`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 28px 20px 16px;
  display: flex;
  gap: 1rem;
  flex-direction: column;
`

export const Loading = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.skeleton} 8%,
    ${({ theme }) => theme.skeletonShine} 18%,
    ${({ theme }) => theme.skeleton} 33%
  );
  border-radius: 4px;
  background-size: 200% 100%;
  animation: 1.5s ${shine} linear infinite;
`

const Title = styled(Loading)`
  height: 41px;
`

const Tab = styled(Loading)`
  height: 28px;
  border-radius: 999px;
`

function ContentLoader() {
  return (
    <StyledPositionCard>
      <Title />
      <Tab />
      <Loading style={{ height: '104px' }} />
      <Loading style={{ height: '128px' }} />

      <Flex>
        <Loading style={{ height: '36px', flex: 1, borderRadius: '999px' }} />
        <Loading style={{ height: '36px', flex: 1, marginLeft: '1rem', borderRadius: '999px' }} />
      </Flex>

      <Divider />

      <Loading style={{ height: '15px', width: '80px', borderRadius: '999px' }} />
    </StyledPositionCard>
  )
}

export default ContentLoader
