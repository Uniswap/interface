import { Percent } from '@uniswap/sdk-core'
import { Scrim } from 'components/AccountDrawer/Scrim'
import MaxSlippageSettings from 'components/Settings/MaxSlippageSettings'
import MenuButton from 'components/Settings/MenuButton'
import MultipleRoutingOptions from 'components/Settings/MultipleRoutingOptions'
import RouterPreferenceSettings from 'components/Settings/RouterPreferenceSettings'
import TransactionDeadlineSettings from 'components/Settings/TransactionDeadlineSettings'
import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useIsUniswapXSupportedChain } from 'hooks/useIsUniswapXSupportedChain'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import styled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { useCallback, useMemo, useRef } from 'react'
import { X } from 'react-feather'
import { Trans } from 'react-i18next'
import { useCloseModal, useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { Divider, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { HeightAnimator } from 'ui/src'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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

const StyledDivider = styled(Divider)`
  margin: 16px 0px;
`

export default function SettingsTab({
  autoSlippage,
  chainId,
  trade,
  compact = false,
  hideRoutingSettings = false,
}: {
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
  compact?: boolean
  hideRoutingSettings?: boolean
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

  const multipleRoutingOptionsEnabled = useFeatureFlag(FeatureFlags.MultipleRoutingOptions)
  const uniswapXEnabled = useIsUniswapXSupportedChain(chainId)
  const showRoutingSettings = Boolean(uniswapXEnabled && !hideRoutingSettings && !multipleRoutingOptionsEnabled)

  const isChainSupported = useIsSupportedChainId(chainId)
  const Settings = useMemo(
    () => (
      <>
        {showRoutingSettings && (
          <AutoColumn gap="16px">
            <RouterPreferenceSettings />
          </AutoColumn>
        )}
        <HeightAnimator open={!isUniswapXTrade(trade)}>
          <ExpandColumn $padTop={showRoutingSettings}>
            {showRoutingSettings && <Divider />}
            <MaxSlippageSettings autoSlippage={autoSlippage} />
            {showDeadlineSettings && <TransactionDeadlineSettings />}
          </ExpandColumn>
        </HeightAnimator>
        {multipleRoutingOptionsEnabled && (
          <>
            {!isUniswapXTrade(trade) && <StyledDivider />}
            <MultipleRoutingOptions chainId={chainId} />
          </>
        )}
      </>
    ),
    [autoSlippage, chainId, multipleRoutingOptionsEnabled, showDeadlineSettings, showRoutingSettings, trade],
  )

  return (
    <Menu ref={toggleButtonNode}>
      <MenuButton disabled={!isChainSupported} isActive={isOpen} compact={compact} onClick={toggleMenu} trade={trade} />
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
