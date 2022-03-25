import React, { useContext } from 'react'
import { RowFixed } from '../Row/index'
import styled, { ThemeContext } from 'styled-components'
import { useMultihopManager, useUserSlippageTolerance } from '../../state/user/hooks'
import { Text } from 'rebass'
import { Button } from 'rebass/styled-components'
import { transparentize } from 'polished'
import { ReactComponent as EcoRouter } from '../../assets/svg/eco-router.svg'
import { ReactComponent as Slippage } from '../../assets/svg/slippage.svg'
import { ReactComponent as Recipient } from '../../assets/svg/recipient.svg'
import { ReactComponent as MEVProtection } from '../../assets/svg/mev-protection.svg'
import { useSwapState } from '../../state/swap/hooks'
import { useToggleSettingsMenu } from '../../state/application/hooks'
import { MouseoverTooltip } from '../Tooltip/index'
import { useTranslation } from 'react-i18next'

const StyledButton = styled(Button)<{ active?: boolean; cursor?: string }>`
  height: 20px;
  cursor: ${({ cursor }) => cursor};
  line-height: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  background-color: ${({ theme, active }) => (active ? transparentize(0.92, theme.green2) : theme.bg7)};
  border-radius: ${({ active }) => active && '5px'};
  border: ${({ theme, active }) => `solid 1px ${active ? transparentize(0.35, theme.green2) : theme.bg7}`};
  font-size: 10px;
  padding: 4px 4px;
  path {
    fill: ${({ theme, active }) => (active ? theme.green2 : theme.gray1)};
  }
`

const StyledRowFixed = styled(RowFixed)`
  > *:not(:first-child) {
    margin-left: 8px;
  }
`

export function SwapSettings() {
  const [userSlippageTolerance] = useUserSlippageTolerance()
  const [multihop] = useMultihopManager()
  const theme = useContext(ThemeContext)
  const { recipient } = useSwapState()
  const toggle = useToggleSettingsMenu()
  const { t } = useTranslation()

  return (
    <StyledRowFixed alignItems="center">
      <MouseoverTooltip content={t('slippagePercentage')} placement="top">
        <StyledButton active={!!userSlippageTolerance} cursor="pointer" onClick={toggle}>
          <Slippage />
          <Text color={!!userSlippageTolerance ? transparentize(0.2, theme.green2) : theme.gray1} ml="4px">
            {(userSlippageTolerance / 100).toFixed(1)}%
          </Text>
        </StyledButton>
      </MouseoverTooltip>
      <MouseoverTooltip content={multihop ? t('multihopEnabled') : t('multihopDisabled')} placement="top">
        <StyledButton active={multihop} cursor="pointer" onClick={toggle}>
          <EcoRouter />
        </StyledButton>
      </MouseoverTooltip>
      <MouseoverTooltip content={t('alternateReceiver')} placement="top">
        <StyledButton active={!!recipient}>
          <Recipient />
        </StyledButton>
      </MouseoverTooltip>
      <MouseoverTooltip content={t('MEVProtectionComingSoon')} placement="top">
        <StyledButton>
          <MEVProtection />
        </StyledButton>
      </MouseoverTooltip>
    </StyledRowFixed>
  )
}
