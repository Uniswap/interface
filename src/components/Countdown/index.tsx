import React from 'react'
import { Duration } from 'luxon'
import { useState } from 'react'
import { useInterval } from 'react-use'

interface CountdownProps {
  to: number
}

export default function Countdown({ to }: CountdownProps) {
  const [isRunning] = useState(to * 1000 > Date.now())
  const [duration, setDuration] = useState(Duration.fromMillis(isRunning ? to * 1000 - Date.now() : 0))

  useInterval(
    () => {
      setDuration(duration.minus(1000))
    },
    isRunning ? 1000 : null
  )

  return <div>{duration.toFormat('hh:mm:ss')}</div>
}
