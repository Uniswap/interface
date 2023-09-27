import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Scrim } from 'components/AccountDrawer'
import AnimatedDropdown from 'components/AnimatedDropdown'
import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import { isSupportedChain, L2_CHAIN_IDS } from 'constants/chains'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Portal } from 'nft/components/common/Portal'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo, useRef } from 'react'
import { X } from 'react-feather'
import { useCloseModal, useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components'
import { Divider, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

import MaxSlippageSettings from './MaxSlippageSettings'
import MenuButton from './MenuButton'
import RouterPreferenceSettings from './RouterPreferenceSettings'
import TransactionDeadlineSettings from './TransactionDeadlineSettings'

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  height: 24px;
  padding: 0;
  width: 24px;
`

const Menu = styled.div`
  position: relative;
`

const MenuFlyout = styled(AutoColumn)`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  position: absolute;
  top: 100%;
  margin-top: 10px;
  right: 0;
  z-index: 100;
  color: ${({ theme }) => theme.neutral1};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    min-width: 18.125rem;
  `};
  user-select: none;
  padding: 16px;
`

const ExpandColumn = styled(AutoColumn)<{ $padTop: boolean }>`
  gap: 16px;
  padding-top: ${({ $padTop }) => ($padTop ? '16px' : '0')};
`

const MobileMenuContainer = styled(Row)`
  overflow: visible;
  position: fixed;
  height: 100%;
  top: 100vh;
  left: 0;
  right: 0;
  width: 100%;
  z-index: ${Z_INDEX.fixed};
`

const MobileMenuWrapper = styled(Column)<{ $open: boolean }>`
  height: min-content;
  width: 100%;
  padding: 8px 16px 24px;
  background-color: ${({ theme }) => theme.surface1};
  overflow: hidden;
  position: absolute;
  bottom: ${({ $open }) => ($open ? `100vh` : 0)};
  transition: bottom ${({ theme }) => theme.transition.duration.medium};
  border: ${({ theme }) => `1px solid ${theme.surface3}`};
  border-radius: 12px;
  border-bottom-right-radius: 0px;
  border-bottom-left-radius: 0px;
  font-size: 16px;
  box-shadow: unset;
  z-index: ${Z_INDEX.modal};
`

const MobileMenuHeader = styled(Row)`
  margin-bottom: 16px;
`

export default function SettingsTab({
  autoSlippage,
  chainId,
  trade,
  showRoutingSettings = true,
}: {
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
  showRoutingSettings?: boolean
}) {
  const { chainId: connectedChainId } = useWeb3React()
  const showDeadlineSettings = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))
  const node = useRef<HTMLDivElement | null>(null)
  const isOpen = useModalIsOpen(ApplicationModal.SETTINGS)

  const closeModal = useCloseModal()
  const closeMenu = useCallback(() => closeModal(ApplicationModal.SETTINGS), [closeModal])
  const toggleMenu = useToggleSettingsMenu()

  const isMobile = useIsMobile()
  const isOpenMobile = isOpen && isMobile
  const isOpenDesktop = isOpen && !isMobile

  useOnClickOutside(node, isOpenDesktop ? closeMenu : undefined)
  useDisableScrolling(isOpen)

  const isChainSupported = isSupportedChain(chainId)
  const Settings = useMemo(
    () => (
      <>
        {showRoutingSettings && (
          <AutoColumn gap="16px">
            <RouterPreferenceSettings />
          </AutoColumn>
        )}
        <AnimatedDropdown open={!isUniswapXTrade(trade)}>
          <ExpandColumn $padTop={showRoutingSettings}>
            {showRoutingSettings && <Divider />}
            <MaxSlippageSettings autoSlippage={autoSlippage} />
            {showDeadlineSettings && (
              <>
                <Divider />
                <TransactionDeadlineSettings />
              </>
            )}
          </ExpandColumn>
        </AnimatedDropdown>
      </>
    ),
    [autoSlippage, showDeadlineSettings, showRoutingSettings, trade]
  )

  return (
    <Menu ref={node}>
      <MenuButton disabled={!isChainSupported || chainId !== connectedChainId} isActive={isOpen} onClick={toggleMenu} />
      {isOpenDesktop && <MenuFlyout>{Settings}</MenuFlyout>}
      {isOpenMobile && (
        <Portal>
          <MobileMenuContainer data-testid="mobile-settings-menu">
            <Scrim onClick={closeMenu} $open />
            <MobileMenuWrapper $open>
              <MobileMenuHeader padding="8px 0px 4px">
                <CloseButton data-testid="mobile-settings-close" onClick={closeMenu}>
                  <X size={24} />
                </CloseButton>
                <Row padding="0px 24px 0px 0px" justify="center">
                  <ThemedText.SubHeader>
                    <Trans>Settings</Trans>
                  </ThemedText.SubHeader>
                </Row>
              </MobileMenuHeader>
              {Settings}
            </MobileMenuWrapper>
          </MobileMenuContainer>
        </Portal>
      )}
    </Menu>
  )
}
