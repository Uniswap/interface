import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import useGetGrantProgram from 'hooks/campaigns/useGetGrantProgram'
import useTheme from 'hooks/useTheme'

import SingleProgram from './SingleProgram'

const Wrapper = styled.div`
  display: flex;
  height: 400px;
  width: 100%;
  justify-content: center;
  align-items: center;
`

type Props = {
  id: string
}

const SpecificProgram: React.FC<Props> = ({ id }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { data, isValidating, error } = useGetGrantProgram(id)

  if (isValidating) {
    return (
      <Wrapper>
        <Loader />
      </Wrapper>
    )
  }

  if (error) {
    navigate(APP_PATHS.GRANT_PROGRAMS)

    return (
      <Wrapper>
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '16px',
            color: theme.text,
          }}
        >
          {JSON.stringify(error) || <Trans>Something went wrong</Trans>}
        </Text>
      </Wrapper>
    )
  }

  return <SingleProgram program={data} />
}

export default SpecificProgram
