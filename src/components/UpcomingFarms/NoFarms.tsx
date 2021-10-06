import { ButtonEmpty } from 'components/Button'
import React from 'react'

import { NoFarmsWrapper, NoFarmsMessage } from './styled'

const NoFarms = ({ setActiveTab }: { setActiveTab: (activeTab: number) => void }) => {
  return (
    <NoFarmsWrapper>
      <NoFarmsMessage>Currently there are no Upcoming Farms.</NoFarmsMessage>
      <div>
        Please check the{' '}
        <ButtonEmpty width="fit-content" padding="0" style={{ display: 'inline' }} onClick={() => setActiveTab(0)}>
          Current Farms
        </ButtonEmpty>{' '}
        or come back later.
      </div>
    </NoFarmsWrapper>
  )
}

export default NoFarms
