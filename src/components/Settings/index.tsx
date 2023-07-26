import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import AnimatedDropdown from 'components/AnimatedDropdown'
import { AutoColumn } from 'components/Column'
import { isSupportedChain, L2_CHAIN_IDS } from 'constants/chains'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components/macro'
import { Divider } from 'theme'

import MaxSlippageSettings from './MaxSlippageSettings'
import MenuButton from './MenuButton'
import RouterPreferenceSettings from './RouterPreferenceSettings'
import TransactionDeadlineSettings from './TransactionDeadlineSettings'

const Menu = styled.div`
  position: relative;
`

const MenuFlyout = styled(AutoColumn)`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  position: absolute;
  top: 100%;
  margin-top: 10px;
  right: 0;
  z-index: 100;
  color: ${({ theme }) => theme.textPrimary};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    min-width: 18.125rem;
  `};
  user-select: none;
  padding: 16px;
`

const ExpandColumn = styled(AutoColumn)`
  gap: 16px;
  padding-top: 16px;
`

export default function SettingsTab({
  autoSlippage,
  chainId,
  trade,
}: {
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
}) {
  const { chainId: connectedChainId } = useWeb3React()
  const showDeadlineSettings = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))

  const node = useRef<HTMLDivElement | null>(null)
  const isOpen = useModalIsOpen(ApplicationModal.SETTINGS)

  const toggleMenu = useToggleSettingsMenu()
  useOnClickOutside(node, isOpen ? toggleMenu : undefined)

  useDisableScrolling(isOpen)

  const isChainSupported = isSupportedChain(chainId)

  return (
    <Menu ref={node}>
      <MenuButton disabled={!isChainSupported || chainId !== connectedChainId} isActive={isOpen} onClick={toggleMenu} />
      {isOpen && (
        <MenuFlyout>
          <AutoColumn gap="16px">
            <RouterPreferenceSettings />
          </AutoColumn>
          <AnimatedDropdown open={!isUniswapXTrade(trade)}>
            <ExpandColumn>
              <Divider />
              <MaxSlippageSettings autoSlippage={autoSlippage} />
              {showDeadlineSettings && (
                <>
                  <Divider />
                  <TransactionDeadlineSettings />
                </>
              )}
            </ExpandColumn>
          </AnimatedDropdown>
        </MenuFlyout>
      )}
    </Menu>
  )
}
