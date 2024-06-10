import { Percent } from '@uniswap/sdk-core'
import { Scrim } from 'components/AccountDrawer'
import AnimatedDropdown from 'components/AnimatedDropdown'
import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import MultipleRoutingOptions from 'components/Settings/MultipleRoutingOptions'
import { isUniswapXSupportedChain, L2_CHAIN_IDS, useIsSupportedChainId } from 'constants/chains'
import { useIsMobile } from 'hooks/screenSize'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Trans } from 'i18n'
import { Portal } from 'nft/components/common/Portal'
import { useCallback, useMemo, useRef } from 'react'
import { X } from 'react-feather'
import { useCloseModal, useModalIsOpen, useToggleSettingsMenu } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import styled from 'styled-components'
import { Divider, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  useHook
}: {
  autoSlippage: Percent
  chainId?: number
  trade?: InterfaceTrade
  compact?: boolean
  hideRoutingSettings?: boolean
  useHook?: Function
}) {
  const showDeadlineSettings = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))
  const toggleButtonNode = useRef<HTMLDivElement | null>(null)
  const menuNode = useRef<HTMLDivElement | null>(null)
  const isOpen = useModalIsOpen(ApplicationModal.SETTINGS)

  const closeModal = useCloseModal()
  const closeMenu = useCallback(() => closeModal(ApplicationModal.SETTINGS), [closeModal])
  const toggleMenu = useToggleSettingsMenu()

  const isMobile = useIsMobile()
  const isOpenMobile = isOpen && isMobile
  const isOpenDesktop = isOpen && !isMobile

  useOnClickOutside(menuNode, isOpenDesktop ? closeMenu : undefined, [toggleButtonNode])
  useDisableScrolling(isOpen)

  const multipleRoutingOptionsEnabled = useFeatureFlag(FeatureFlags.MultipleRoutingOptions)
  const uniswapXEnabled = chainId && isUniswapXSupportedChain(chainId)
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
        <AnimatedDropdown open={!isUniswapXTrade(trade)}>
          <ExpandColumn $padTop={showRoutingSettings}>
            {showRoutingSettings && <Divider />}
            <MaxSlippageSettings autoSlippage={autoSlippage} />
            {showDeadlineSettings && <TransactionDeadlineSettings />}
            {/* <HookSettings /> */}
          </ExpandColumn>
        </AnimatedDropdown>
        {multipleRoutingOptionsEnabled && (
          <>
            {!isUniswapXTrade(trade) && <StyledDivider />}
            <MultipleRoutingOptions chainId={chainId} />
          </>
        )}
      </>
    ),
    [autoSlippage, chainId, multipleRoutingOptionsEnabled, showDeadlineSettings, showRoutingSettings, trade]
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

// function HookSettings() {

//   return (
//       <Row>
//         <InputContainer gap="md" error={!!deadlineError}>
//           <Input
//             data-testid="deadline-input"
//             placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
//             value={deadlineInput}
//             onChange={(e) => parseCustomDeadline(e.target.value)}
//             onBlur={() => {
//               // When the input field is blurred, reset the input field to the current deadline
//               setDeadlineInput(defaultInputValue)
//               setDeadlineError(false)
//             }}
//           />
//           <ThemedText.BodyPrimary>
//             <Trans i18nKey="common.time.minutes" />
//           </ThemedText.BodyPrimary>
//         </InputContainer>
//       </Row>
//   )
// }
