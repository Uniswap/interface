import React, { useEffect } from 'react'
import { Duration } from 'luxon'
import { useState } from 'react'
import { useInterval } from 'react-use'

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
    setDurationText(`${splitRawText[0]}D ${splitRawText[1]}H ${splitRawText[2]}M ${splitRawText[3]}S`)
  }, [duration])

  return <>{durationText}</>
}
