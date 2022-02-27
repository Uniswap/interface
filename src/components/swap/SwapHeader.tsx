import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

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

export default function SwapHeader() {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <Link style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }} to="/pool">
            <HoverText>
              <Trans>← Back to Dashboard</Trans>
            </HoverText>
          </Link>
        </RowFixed>
        {/* <RowFixed>
          <SettingsTab />
        </RowFixed> */}
      </RowBetween>
    </StyledSwapHeader>
  )
}
