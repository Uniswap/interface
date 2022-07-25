import { ButtonEmpty } from 'components/Button'
import React from 'react'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'

import { NoFarmsWrapper, NoFarmsMessage } from './styled'
import { useHistory } from 'react-router-dom'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { VERSION } from 'constants/v2'
import useTheme from 'hooks/useTheme'

const NoFarms = () => {
  const history = useHistory()
  const qs = useParsedQueryString()
  const farmType = qs.tab || VERSION.ELASTIC
  const theme = useTheme()
  return (
    <NoFarmsWrapper>
      <NoFarmsMessage>Currently there are no Upcoming Farms.</NoFarmsMessage>
      <Text color={theme.subText}>
        <Trans>
          Please check the{' '}
          <ButtonEmpty
            width="fit-content"
            padding="0"
            style={{ display: 'inline' }}
            onClick={() => history.replace(`/farms?type=active&tab=${farmType}`)}
          >
            Active Farms
          </ButtonEmpty>{' '}
          or come back later.
        </Trans>
      </Text>
    </NoFarmsWrapper>
  )
}

export default NoFarms
