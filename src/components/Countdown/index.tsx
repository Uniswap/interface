import React, { useEffect } from 'react'
import { Duration } from 'luxon'
import { useState } from 'react'
import { useInterval } from 'react-use'
import styled from 'styled-components'

const Root = styled.div`
  background: linear-gradient(113.18deg, #ffffff -0.1%, rgba(0, 0, 0, 0) 98.9%), #28263f;
  background-blend-mode: overlay, normal;
  border-radius: 4px;
  padding: 2px 4px;
`

const Text = styled.div`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${props => props.theme.white};
`

interface CountdownProps {
  to: number
}

export default function Countdown({ to }: CountdownProps) {
  const [isRunning] = useState(to * 1000 > Date.now())
  const [duration, setDuration] = useState(Duration.fromMillis(isRunning ? to * 1000 - Date.now() : 0))
  const [durationText, setDurationText] = useState('')

  useInterval(
    () => {
      setDuration(duration.minus(1000))
    },
    isRunning ? 1000 : null
  )

  useEffect(() => {
    const rawText = duration.toFormat('dd/hh/mm/ss')
    const splitRawText = rawText.split('/')
    const remainingDays = splitRawText[0] === '00' ? '' : `${splitRawText[0]}D `
    const remainingHours = splitRawText[1] === '00' ? '' : `${splitRawText[1]}H `
    const remainingMinutes = splitRawText[2] === '00' ? '' : `${splitRawText[2]}M `
    const remainingSeconds = splitRawText[3] === '00' ? '' : `${splitRawText[3]}S`
    setDurationText(remainingDays + remainingHours + remainingMinutes + remainingSeconds)
  }, [duration])

  return (
    <Root>
      <Text>{durationText}</Text>
    </Root>
  )
}
