import { Trans } from '@lingui/macro'
import { Box, FormControlLabel, Switch } from '@material-ui/core'
import { Percent } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

import { useExpertModeManager } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

const HoverText = styled(TYPE.main)`
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
`

export default function MarketHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  const [expertMode, toggleExpertMode] = useExpertModeManager()

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <HoverText>
            <Box>
              PRO Mode
              <Switch checked={expertMode} color="primary" onClick={() => toggleExpertMode()} />
            </Box>
          </HoverText>
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
