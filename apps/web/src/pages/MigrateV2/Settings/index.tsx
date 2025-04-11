import { Percent } from '@uniswap/sdk-core'
import { Scrim } from 'components/AccountDrawer/Scrim'
import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import styled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import MaxSlippageSettings from 'pages/MigrateV2/Settings/MaxSlippageSettings'
import MenuButton from 'pages/MigrateV2/Settings/MenuButton'
import TransactionDeadlineSettings from 'pages/MigrateV2/Settings/TransactionDeadlineSettings'
import { useCallback, useMemo, useRef } from 'react'
import { X } from 'react-feather'
import { Trans } from 'react-i18next'
import { useCloseModal, useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { HeightAnimator } from 'ui/src'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'

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
  box-shadow:
    0px 0px 1px rgba(0, 0, 0, 0.01),
    0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 16px 24px rgba(0, 0, 0, 0.04),
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
  gap: 8px;
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

// @deprecated
// Should use <SwapFormSettings settings={[Slippage, Deadline]} ... /> from packages/uniswap/src/features/transactions/swap/form/SwapFormSettings
export default function MigrateV2SettingsTab({
  autoSlippage,
  chainId,
  compact = false,
}: {
  autoSlippage: Percent
  chainId?: number
  compact?: boolean
}) {
  const showDeadlineSettings = !isL2ChainId(chainId)
  const toggleButtonNode = useRef<HTMLDivElement | null>(null)
  const menuNode = useRef<HTMLDivElement | null>(null)
  const isOpen = useModalIsOpen(ApplicationModal.SETTINGS)

  const closeModal = useCloseModal(ApplicationModal.SETTINGS)
  const closeMenu = useCallback(() => closeModal(), [closeModal])
  const toggleMenu = useToggleSettingsMenu()

  const isMobile = useIsMobile()
  const isOpenMobile = isOpen && isMobile
  const isOpenDesktop = isOpen && !isMobile

  useOnClickOutside(menuNode, isOpenDesktop ? closeMenu : undefined, [toggleButtonNode])
  useDisableScrolling(isOpen)

  const isChainSupported = useIsSupportedChainId(chainId)
  const Settings = useMemo(
    () => (
      <HeightAnimator open>
        <ExpandColumn $padTop={false}>
          <MaxSlippageSettings autoSlippage={autoSlippage} />
          {showDeadlineSettings && <TransactionDeadlineSettings />}
        </ExpandColumn>
      </HeightAnimator>
    ),
    [autoSlippage, showDeadlineSettings],
  )

  return (
    <Menu ref={toggleButtonNode}>
      <MenuButton disabled={!isChainSupported} isActive={isOpen} compact={compact} onClick={toggleMenu} />
      {isOpenDesktop && <MenuFlyout ref={menuNode}>{Settings}</MenuFlyout>}
      {isOpenMobile && (
        <Portal>
          <MobileMenuContainer data-testid="mobile-settings-menu" ref={menuNode}>
            <Scrim onClick={closeMenu} $open />
            <MobileMenuWrapper $open>
              <MobileMenuHeader padding="8px 0px 4px">
                <CloseButton data-testid="mobile-settings-close" onClick={closeMenu}>
                  <X size={24} />
                </CloseButton>
                <Row padding="0px 24px 0px 0px" justify="center">
                  <ThemedText.SubHeader>
                    <Trans i18nKey="common.settings" />
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
