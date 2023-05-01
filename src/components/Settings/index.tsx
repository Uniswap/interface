// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendEvent } from 'components/analytics'
import Column, { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { L2_CHAIN_IDS } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { isSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import { useRef } from 'react'
import { Settings } from 'react-feather'
import { useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useClientSideRouter } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import MaxSlippageSettings from './MaxSlippageSettings'
import TransactionDeadlineSettings from './TransactionDeadlineSettings'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;
  > * {
    stroke: ${({ theme }) => theme.textSecondary};
  }
`

const StyledMenuButton = styled.button<{ disabled: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  border-radius: 0.5rem;
  height: 20px;
  ${({ disabled }) =>
    !disabled &&
    `
    :hover,
    :focus {
      cursor: pointer;
      outline: none;
      opacity: 0.7;
    }
  `}
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 2rem;
  right: 0rem;
  z-index: 100;
  color: ${({ theme }) => theme.textPrimary};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    min-width: 18.125rem;
  `};
  user-select: none;
`

const ClientSideRouterSettings = styled.div<{ enabled: boolean }>`
  opacity: ${({ enabled }) => (enabled ? 1 : 0.3)};
  pointer-events: ${({ enabled }) => (enabled ? 'auto' : 'none')};
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.backgroundOutline};
`

export default function SettingsTab({ placeholderSlippage }: { placeholderSlippage: Percent }) {
  const { chainId } = useWeb3React()
  const showDeadlineSettings = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))

  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SETTINGS)

  const toggle = useToggleSettingsMenu()
  useOnClickOutside(node, open ? toggle : undefined)

  const [clientSideRouterEnabled, setClientSideRouterEnabled] = useClientSideRouter()

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton
        disabled={!isSupportedChainId(chainId)}
        onClick={toggle}
        id="open-settings-dialog-button"
        aria-label={t`Transaction Settings`}
      >
        <StyledMenuIcon data-testid="swap-settings-button" />
      </StyledMenuButton>
      {open && (
        <MenuFlyout>
          <AutoColumn gap="16px" style={{ padding: '1rem' }}>
            {isSupportedChainId(chainId) && (
              <RowBetween>
                <RowFixed>
                  <Column gap="xs">
                    <ThemedText.BodySecondary>
                      <Trans>Auto Router API</Trans>
                    </ThemedText.BodySecondary>
                    <ThemedText.Caption color="textSecondary">
                      <Trans>Finds the best route across liquidity sources.</Trans>
                    </ThemedText.Caption>
                  </Column>
                </RowFixed>
                <Toggle
                  id="toggle-optimized-router-button"
                  isActive={!clientSideRouterEnabled}
                  toggle={() => {
                    sendEvent({
                      category: 'Routing',
                      action: clientSideRouterEnabled ? 'enable routing API' : 'disable routing API',
                    })
                    setClientSideRouterEnabled(!clientSideRouterEnabled)
                  }}
                />
              </RowBetween>
            )}
            <Divider />
            <ClientSideRouterSettings enabled={clientSideRouterEnabled}>
              <AutoColumn gap="16px">
                <MaxSlippageSettings placeholder={placeholderSlippage} />
                {showDeadlineSettings && (
                  <>
                    <Divider />
                    <TransactionDeadlineSettings />
                  </>
                )}
              </AutoColumn>
            </ClientSideRouterSettings>
          </AutoColumn>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
