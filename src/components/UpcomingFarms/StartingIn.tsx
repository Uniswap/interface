import React from 'react'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'

import useTheme from 'hooks/useTheme'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

const StartingIn = ({ startingIn }: { startingIn?: string }) => {
  const theme = useTheme()

  if (!startingIn) {
    return (
      <Text color={theme.subText}>
        <Trans>Coming soon</Trans>
      </Text>
    )
  }

  const timeDiff = new Date(startingIn).getTime() - Date.now()

  if (timeDiff < 0) {
    return null
  }

  if (timeDiff < 0) {
    return null
  }

  const seconds = Math.abs(timeDiff) / 1000

  return <Text color={theme.subText}>{getFormattedTimeFromSecond(seconds)}</Text>
}

export default StartingIn
