import { transparentize } from 'polished'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import { TYPE } from '../../theme'

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const MonoFront = styled(TYPE.body)<{ faded?: boolean }>`
  font-variant-numeric: tabular-nums;
  background-color: ${({ theme }) => transparentize(0.7, theme.bg3)};
  padding: 6px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 15px;
  opacity: ${({ faded }) => (faded ? 0.5 : 1)};

  > * {
    text-align: center;
    font-size: 15px;
  }
`

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.white};
`

export function Countdown({ exactStart, exactEnd }: { exactStart: Date; exactEnd: Date }) {
  // get end/beginning times
  const begin = Math.floor(exactStart.getTime() / 1000)
  const end = Math.floor(exactEnd.getTime() / 1000)

  // get current time
  const [time, setTime] = useState(() => Math.floor(Date.now() / 1000))
  useEffect((): (() => void) | void => {
    // we only need to tick if rewards haven't ended yet
    if (time <= end) {
      const timeout = setTimeout(() => setTime(Math.floor(Date.now() / 1000)), 1000)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [time, end])

  const timeUntilGenesis = begin - time
  const timeUntilEnd = end - time

  let timeRemaining: number
  let message: string
  if (timeUntilGenesis >= 0) {
    message = ''
    timeRemaining = timeUntilGenesis
  } else {
    const ongoing = timeUntilEnd >= 0
    if (ongoing) {
      message = ''
      timeRemaining = timeUntilEnd
    } else {
      message = 'Rewards ended!'
      timeRemaining = Infinity
    }
  }

  const days = (timeRemaining - (timeRemaining % DAY)) / DAY
  timeRemaining -= days * DAY
  const hours = (timeRemaining - (timeRemaining % HOUR)) / HOUR
  timeRemaining -= hours * HOUR
  const minutes = (timeRemaining - (timeRemaining % MINUTE)) / MINUTE
  timeRemaining -= minutes * MINUTE
  const seconds = timeRemaining

  return (
    <MonoFront fontWeight={700} faded={timeUntilGenesis >= 0}>
      <span style={{ fontSize: '16px', marginRight: '4px' }}>{message !== '' ? message : <Dot />}</span>
      {Number.isFinite(timeRemaining) && (
        <code>
          {timeUntilGenesis >= 0
            ? `${days}d ${hours.toString().padStart(2, '0')}h`
            : `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds
                .toString()
                .padStart(2, '0')}`}
          s
        </code>
      )}
    </MonoFront>
  )
}
