import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { ChevronDown } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

import { TYPE } from '../../theme'
import { FlyoutAlignment } from '../Menu'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledFaucetHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

export default function FaucetHeader() {
  return (
    <StyledFaucetHeader>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            <Trans>UZH Ethereum Faucet</Trans>
          </TYPE.black>
        </RowFixed>
        <RowFixed>
          <h2>second row</h2>
          {/*<SettingsTab placeholderSlippage={allowedSlippage} />*/}
        </RowFixed>
      </RowBetween>
    </StyledFaucetHeader>
  )
}
