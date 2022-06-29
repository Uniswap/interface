import React from 'react'
import styled from 'styled-components/macro'

const ProgressBarContainer = styled.div<{ height?: string }>`
  height: ${({ height }) => height ?? '100%'};
  width: 100%;
  background-color: whitesmoke;
  border-radius: 40px;
`

const ProgressBarFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${({ progress }) => `${progress}%` ?? '100%'};
  color: ${({ theme, progress }) => (progress < 10 ? theme.black : theme.text1)};
  background-color: ${({ theme }) => theme.primary3};
  border-radius: 40px;
  text-align: right;
  transition: width 0.3s ease;
`

const ProgressBarText = styled.span`
  padding: 10px;
  font-weight: 900;
`

const ProgressBar = ({ progress, height }: { progress: number; height: string }) => {
  return (
    <ProgressBarContainer height={height}>
      <ProgressBarFill progress={progress}>
        <ProgressBarText>{`${progress}%`}</ProgressBarText>
      </ProgressBarFill>
    </ProgressBarContainer>
  )
}

export default ProgressBar
