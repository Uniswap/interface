import { AutoColumn } from 'components/Column'
import { CardNoise } from 'components/earn/styled'
import React from 'react'
import Countdown, { CountdownRenderProps } from 'react-countdown'
import { STAKING_GENESIS } from 'state/stake/hooks'
import styled from 'styled-components'
import { Dial } from './Dial'

const COUNTDOWN_LENGTH = 12 * 24 * 60 * 60 * 1000
export const COUNTDOWN_END = STAKING_GENESIS * 1000

export const LaunchCountdown: React.FC = () => {
  const percentage = 100 * (1 - (COUNTDOWN_END - Date.now()) / COUNTDOWN_LENGTH)

  const countdownRenderer = (countdownProps: CountdownRenderProps) => {
    const { days, hours, minutes, seconds } = countdownProps
    const d = String(days)
    const h = String(hours)
    const m = String(minutes)
    const s = String(seconds)
    return (
      <StyledCountdown>
        {d.padStart(2, '0')}:{h.padStart(2, '0')}:{m.padStart(2, '0')}:{s.padStart(2, '0')}
      </StyledCountdown>
    )
  }
  return (
    <StyledCard showBackground={false}>
      <CardNoise />
      <Dial value={percentage}>
        <StyledCountdownWrapper>
          <StyledCountdownTitle>Rewards begin in...</StyledCountdownTitle>
          <Countdown date={new Date(STAKING_GENESIS * 1000)} renderer={countdownRenderer} />
        </StyledCountdownWrapper>
      </Dial>
    </StyledCard>
  )
}

const StyledCard = styled(AutoColumn)<{ showBackground: boolean }>`
  padding: 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '1')};
  background: ${({ theme, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${theme.primary1} 0%, ${
      showBackground ? theme.black : theme.bg5
    } 100%) `};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;
  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const StyledCountdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledCountdownTitle = styled.p`
  font-size: 20px;
  color: ${(props) => props.theme.text2};
  margin: 0;
`

const StyledCountdown = styled.p`
  font-size: 40px;
  color: ${(props) => props.theme.primaryText1};
  margin: 0;
`
