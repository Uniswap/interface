import { useEffect, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import { ReactComponent as StopWatch } from 'assets/svg/stopwatch.svg'
import useTheme from 'hooks/useTheme'

type Props = {
  shouldCountDown: boolean
  interval: number
  callback: () => void
}

const RefreshTimer: React.FC<Props> = ({ interval, callback, shouldCountDown }) => {
  const [timeLeft, setTimeLeft] = useState(interval)
  const theme = useTheme()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const minutes = shouldCountDown ? Math.floor(timeLeft / 60) : 0
  const seconds = shouldCountDown ? timeLeft - minutes * 60 : 0

  useEffect(() => {
    setTimeLeft(interval)
  }, [interval])

  useEffect(() => {
    if (!shouldCountDown) {
      return
    }

    if (timeLeft <= 0) {
      callbackRef.current()

      const timeOut = setTimeout(() => {
        setTimeLeft(interval)
      }, 1_000)

      return () => {
        clearTimeout(timeOut)
      }
    }

    const timeOut = setTimeout(() => {
      setTimeLeft(tl => tl - 1)
    }, 1_000)

    return () => {
      clearTimeout(timeOut)
    }
  }, [interval, shouldCountDown, timeLeft])

  return (
    <Flex
      sx={{
        gap: '8px',
        alignItems: 'center',
        flex: '0 0 fit-content',
      }}
    >
      <Text
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
        }}
      >
        Refresh in
      </Text>
      <Flex
        sx={{
          width: '60px',
          padding: '2px',
          paddingLeft: '5px',
          background: theme.buttonBlack,
          borderRadius: '12px',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <StopWatch color={theme.subText} />
        <Text
          sx={{
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '16px',
            color: theme.subText,
          }}
        >
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </Text>
      </Flex>
    </Flex>
  )
}

export default RefreshTimer
