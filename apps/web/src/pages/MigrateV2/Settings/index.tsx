import type { Percent } from '@uniswap/sdk-core'
import { Scrim } from 'components/AccountDrawer/Scrim'
import { Portal } from 'components/Popups/Portal'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import useDisableScrolling from 'hooks/useDisableScrolling'
import { useModalState } from 'hooks/useModalState'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import MaxSlippageSettings from 'pages/MigrateV2/Settings/MaxSlippageSettings'
import MenuButton from 'pages/MigrateV2/Settings/MenuButton'
import TransactionDeadlineSettings from 'pages/MigrateV2/Settings/TransactionDeadlineSettings'
import { useCallback, useMemo, useRef } from 'react'
import { X } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { transitions } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'
import { Flex, HeightAnimator, styled, TouchableArea } from 'ui/src'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const MenuFlyout = styled(Flex, {
  minWidth: '20.125rem',
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  boxShadow:
    '0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.01)',
  borderRadius: 12,
  position: 'absolute',
  top: '100%',
  mt: 10,
  right: 0,
  zIndex: 100,
  userSelect: 'none',
  p: 16,
})

// @deprecated
// Should use <TransactionSettings settings={[Slippage, Deadline]} ... /> from packages/uniswap/src/features/transactions/swap/form/SwapFormSettings
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
  const { isOpen, closeModal, toggleModal } = useModalState(ModalName.Settings)

  const closeMenu = useCallback(() => closeModal(), [closeModal])

  const isMobile = useIsMobile()
  const isOpenMobile = isOpen && isMobile
  const isOpenDesktop = isOpen && !isMobile

  useOnClickOutside({
    node: menuNode,
    handler: isOpenDesktop ? closeMenu : undefined,
    ignoredNodes: [toggleButtonNode],
  })
  useDisableScrolling(isOpen)

  const isChainSupported = useIsSupportedChainId(chainId)
  const Settings = useMemo(
    () => (
      <HeightAnimator open>
        <Flex gap="$spacing8">
          <MaxSlippageSettings autoSlippage={autoSlippage} />
          {showDeadlineSettings && <TransactionDeadlineSettings />}
        </Flex>
      </HeightAnimator>
    ),
    [autoSlippage, showDeadlineSettings],
  )

  return (
    <Flex position="relative" ref={toggleButtonNode}>
      <MenuButton disabled={!isChainSupported} isActive={isOpen} compact={compact} onClick={toggleModal} />
      {isOpenDesktop && <MenuFlyout ref={menuNode}>{Settings}</MenuFlyout>}
      {isOpenMobile && (
        <Portal>
          <Flex
            row
            data-testid="mobile-settings-menu"
            ref={menuNode}
            $platform-web={{
              position: 'fixed',
            }}
            height="100%"
            top="100vh"
            left="0"
            right="0"
            width="100%"
            zIndex={Z_INDEX.fixed}
            overflow="visible"
          >
            <Scrim onClick={closeMenu} $open />
            <Flex
              height="min-content"
              width="100%"
              pt={8}
              px={16}
              pb={24}
              backgroundColor="$surface1"
              overflow="hidden"
              position="absolute"
              bottom="100vh"
              transition={`bottom ${transitions.duration.medium}`}
              borderWidth={1}
              borderColor="$surface3"
              borderRadius={12}
              borderBottomRightRadius={0}
              borderBottomLeftRadius={0}
              boxShadow="unset"
              zIndex={Z_INDEX.modal}
            >
              <Flex row pt={8} pb={4} mb={16}>
                <TouchableArea data-testid="mobile-settings-close" onPress={closeMenu}>
                  <X size={24} />
                </TouchableArea>
                <Flex row width="100%" pr={24} justifyContent="center">
                  <ThemedText.SubHeader>
                    <Trans i18nKey="common.settings" />
                  </ThemedText.SubHeader>
                </Flex>
              </Flex>
              {Settings}
            </Flex>
          </Flex>
        </Portal>
      )}
    </Flex>
  )
}
