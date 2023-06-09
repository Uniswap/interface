import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useFiatOnRampButtonEnabled } from 'featureFlags/flags/fiatOnRampButton'
import { useUniswapXEnabled } from 'featureFlags/flags/gouda'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'
import SwapBuyFiatButton from './SwapBuyFiatButton'

const StyledSwapHeader = styled(RowBetween)`
  margin-bottom: 10px;
  color: ${({ theme }) => theme.textSecondary};
`

const HeaderButtonContainer = styled(RowFixed)`
  padding: 0 12px;
  gap: 16px;
`

export default function SwapHeader({ autoSlippage, chainId }: { autoSlippage: Percent; chainId?: number }) {
  const fiatOnRampButtonEnabled = useFiatOnRampButtonEnabled()
  const isUniswapXEnabled = useUniswapXEnabled()

  return (
    <StyledSwapHeader>
      <HeaderButtonContainer>
        <ThemedText.SubHeader>
          {/* TODO (Gouda): remove this and just say "Swap" */}
          {isUniswapXEnabled ? <Trans>Gouda Swap</Trans> : <Trans>Swap</Trans>}
        </ThemedText.SubHeader>
        {fiatOnRampButtonEnabled && <SwapBuyFiatButton />}
      </HeaderButtonContainer>
      <RowFixed>
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} />
      </RowFixed>
    </StyledSwapHeader>
  )
}
