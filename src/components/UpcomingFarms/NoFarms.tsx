import { Trans } from '@lingui/macro'
import { useHistory } from 'react-router-dom'
import { Text } from 'rebass'

import { ButtonEmpty } from 'components/Button'
import { VERSION } from 'constants/v2'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'

import { NoFarmsMessage, NoFarmsWrapper } from './styled'

const NoFarms = () => {
  const history = useHistory()
  const { tab: farmType = VERSION.ELASTIC } = useParsedQueryString<{ tab: string }>()
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
