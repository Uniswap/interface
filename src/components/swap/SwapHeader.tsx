import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import { ButtonPrimary } from '../Button'
import { SmallButtonPrimary } from 'components/Button'

const StyledSwapHeader = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  color: ${({ theme }) => theme.textSecondary};
`
const ResponsiveButtonPrimary = styled(SmallButtonPrimary)`
  border-radius: 16px;
  font-size: 12px;
  padding: 5px 6px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`
export default function SwapHeader({ allowedSlippage, setAction, action}: { allowedSlippage: Percent, setAction:any, action: any}) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '16px' }}>
            <Trans>{action? "Trade": "Borrow"}</Trans>
          </ThemedText.DeprecatedBlack>    
            <ResponsiveButtonPrimary 
             onClick={() => setAction(!action)}
             >
              <Trans>{!action? "Trade": "Borrow"}</Trans>
            </ResponsiveButtonPrimary>

        </RowFixed>

        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}

