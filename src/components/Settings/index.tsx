// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { L2_CHAIN_IDS } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { isSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import { useRef } from 'react'
import { Settings } from 'react-feather'
import { useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'

import MaxSlippageSettings from './MaxSlippageSettings'
import RouterPreferenceSettings from './RouterPreferenceSettings'
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

const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.backgroundOutline};
`

export default function SettingsTab({ autoSlippage }: { autoSlippage: Percent }) {
  const { chainId } = useWeb3React()
  const showDeadlineSettings = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))

  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.SETTINGS)

  const toggle = useToggleSettingsMenu()
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton
        disabled={!isSupportedChainId(chainId)}
        onClick={toggle}
        id="open-settings-dialog-button"
        data-testid="open-settings-dialog-button"
        aria-label={t`Transaction Settings`}
      >
        <StyledMenuIcon data-testid="swap-settings-button" />
      </StyledMenuButton>
      {open && (
        <MenuFlyout>
          <AutoColumn gap="16px" style={{ padding: '1rem' }}>
            {isSupportedChainId(chainId) && <RouterPreferenceSettings />}
            <Divider />
            <MaxSlippageSettings autoSlippage={autoSlippage} />
            {showDeadlineSettings && (
              <>
                <Divider />
                <TransactionDeadlineSettings />
              </>
            )}
          </AutoColumn>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
