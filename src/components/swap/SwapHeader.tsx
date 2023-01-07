import { Trans } from '@lingui/macro'
import { Switch } from '@material-ui/core'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { useExpertModeManager } from '../../state/user/hooks'
import { RowFixed } from '../Row'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
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
