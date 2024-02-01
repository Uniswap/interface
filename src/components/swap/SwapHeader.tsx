import { Trans } from '@lingui/macro'
import { Switch } from '@material-ui/core'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { useExpertModeManager } from '../../state/user/hooks'
import { RowFixed } from '../Row'

const StyledSwapHeader = styled.div`
  padding: 0.3rem 1.25rem 0rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

export default function SwapHeader() {
  const [expertMode, toggleExpertMode] = useExpertModeManager()

  return (
    <StyledSwapHeader>
      <RowFixed>
        <Text>
          <Trans>Show Chart</Trans>
        </Text>
        <Switch checked={expertMode} color="primary" onClick={() => toggleExpertMode()} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
