import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import NotificationPreference from 'components/SubscribeButton/NotificationPreference'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'

const StyledPreference = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: unset;
  `}
`

export default function Overview() {
  const theme = useTheme()
  const { refreshTopics } = useNotification()
  useEffect(() => {
    refreshTopics()
  }, [refreshTopics])
  return (
    <StyledPreference>
      <NotificationPreference
        isInNotificationCenter
        isOpen={true}
        header={
          <Text fontWeight={'500'} color={theme.text} fontSize="14px">
            <Trans>Email Notification</Trans>
          </Text>
        }
      />
    </StyledPreference>
  )
}
