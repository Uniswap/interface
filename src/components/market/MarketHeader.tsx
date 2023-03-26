import { Trans } from '@lingui/macro'
import { Switch } from '@material-ui/core'
import { Percent } from '@uniswap/sdk-core'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { useExpertModeManager } from '../../state/user/hooks'
import { RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledMarketHeader = styled.div`
  display: flex;
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

export default function MarketHeader({
  showChartSwitch = false,
  allowedSlippage,
}: {
  showChartSwitch?: boolean
  allowedSlippage: Percent
}) {
  const [expertMode, toggleExpertMode] = useExpertModeManager()

  return (
    <StyledMarketHeader>
      {showChartSwitch && (
        <RowFixed width="100%">
          <Text>
            <Trans>Show Chart</Trans>
          </Text>
          <Switch checked={expertMode} color="primary" onClick={() => toggleExpertMode()} />
        </RowFixed>
      )}

      <RowFixed justify="flex-end" width="100%">
        <SettingsTab placeholderSlippage={allowedSlippage} />
      </RowFixed>
    </StyledMarketHeader>
  )
}
