import React, { useEffect } from 'react'
import { Duration } from 'luxon'
import { useState } from 'react'
import { useInterval } from 'react-use'

interface CountdownProps {
  to: number
  onEnd?: () => void
  excludeSeconds?: boolean
}

export default function Countdown({ to, onEnd, excludeSeconds = false }: CountdownProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(Duration.fromMillis(0))
  const [durationText, setDurationText] = useState('')

  useEffect(() => {
    const isRunning = to * 1000 > Date.now() - 1000 // more than one second required
    setIsRunning(isRunning)
    setDuration(Duration.fromMillis(isRunning ? to * 1000 - Date.now() : 0))
  }, [to])

  useInterval(
    () => {
      const newDuration = duration.minus(1000)
      if (onEnd && newDuration.toMillis() <= 1000) {
        onEnd()
        setDuration(Duration.fromMillis(0))
      } else setDuration(newDuration)
    },
    isRunning ? 1000 : null
  )

  useEffect(() => {
    const rawText = duration.toFormat('dd/hh/mm/ss')
    const splitRawText = rawText.split('/')
    setDurationText(
      `${splitRawText[0]}D ${splitRawText[1]}H ${splitRawText[2]}M ${!excludeSeconds ? `${splitRawText[3]}S` : ''}`
    )
  }, [duration, excludeSeconds])

  return <>{durationText}</>
}
