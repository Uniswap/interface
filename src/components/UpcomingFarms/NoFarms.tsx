import { ButtonEmpty } from 'components/Button'
import React from 'react'
import { Trans } from '@lingui/macro'

import { NoFarmsWrapper, NoFarmsMessage } from './styled'
import { useHistory } from 'react-router-dom'
import useParsedQueryString from 'hooks/useParsedQueryString'

const NoFarms = () => {
  const history = useHistory()
  const qs = useParsedQueryString()
  const farmType = qs.farmType || 'promm'
  return (
    <NoFarmsWrapper>
      <NoFarmsMessage>Currently there are no Upcoming Farms.</NoFarmsMessage>
      <div>
        <Trans>
          Please check the{' '}
          <ButtonEmpty
            width="fit-content"
            padding="0"
            style={{ display: 'inline' }}
            onClick={() => history.replace(`/farms?tab=active&farmType=${farmType}`)}
          >
            Active Farms
          </ButtonEmpty>{' '}
          or come back later.
        </Trans>
      </div>
    </NoFarmsWrapper>
  )
}

export default NoFarms
