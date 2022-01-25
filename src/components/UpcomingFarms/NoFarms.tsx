import { ButtonEmpty } from 'components/Button'
import React from 'react'
import { Trans } from '@lingui/macro'

import { NoFarmsWrapper, NoFarmsMessage } from './styled'
import { useHistory } from 'react-router-dom'

const NoFarms = () => {
  const history = useHistory()
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
            onClick={() => history.replace('/farms?tab="active"')}
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
