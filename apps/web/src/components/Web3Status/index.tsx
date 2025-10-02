import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import PortfolioDrawer from 'components/AccountDrawer'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Portal } from 'components/Popups/Portal'
import StatusIcon from 'components/StatusIcon'
import { RecentlyConnectedModal } from 'components/Web3Status/RecentlyConnectedModal'
import { useAccountIdentifier } from 'components/Web3Status/useAccountIdentifier'
import { useShowPendingAfterDelay } from 'components/Web3Status/useShowPendingAfterDelay'
import { useModalState } from 'hooks/useModalState'
import { atom, useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { forwardRef, RefObject, useCallback, useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppSelector } from 'state/hooks'
import { AnimatePresence, Button, ButtonProps, Flex, Popover, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { breakpoints } from 'ui/src/theme'
import { useActiveAddresses, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ElementName, InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isIFramed } from 'utils/isIFramed'

const TextStyled = styled.span<{ marginRight?: number }>`
  flex: 1 1 auto;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
  width: fit-content;
  font-weight: 485;
  margin-right: ${({ marginRight = 0 }) => marginRight}px;
  color: ${({ theme }) => theme.neutral1};
`

const Web3StatusGeneric = forwardRef<HTMLDivElement, ButtonProps>(function Web3StatusGeneric(
  { children, ...props },
  ref,
) {
  return (
    <Flex row ref={ref}>
      <Button
        size="xsmall"
        emphasis="text-only"
        userSelect="none"
        backgroundColor="$transparent"
        hoverStyle={{ backgroundColor: '$surface5Hovered' }}
        shouldAnimateBetweenLoadingStates={true}
        {...props}
      >
        {children}
      </Button>
    </Flex>
  )
})

const AddressAndChevronContainer = styled.div<{ $loading?: boolean }>`
  display: flex;
  opacity: ${({ $loading, theme }) => $loading && theme.opacity.disabled};
  align-items: center;

  @media only screen and (max-width: ${breakpoints.xl}px) {
    display: none;
  }
`

const ExistingUserCTAButton = forwardRef<HTMLDivElement, { onPress: () => void }>(function ExistingUserCTAButton(
  { onPress },
  ref,
) {
  const { t } = useTranslation()

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isLogIn = isEmbeddedWalletEnabled

  return (
    <Button
      fill={false}
      size="small"
      variant="branded"
      emphasis="primary"
      tabIndex={0}
      data-testid="navbar-connect-wallet"
      ref={ref}
      onPress={onPress}
    >
      {isLogIn ? t('nav.logIn.button') : t('common.connect.button')}
    </Button>
  )
})

export const Web3StatusRef = atom<RefObject<HTMLElement> | undefined>(undefined)

function Web3StatusInner() {
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  const activeAddresses = useActiveAddresses()
  const { isConnecting } = useConnectionStatus()
  const ref = useRef<HTMLDivElement>(null)
  const [, setRef] = useAtom(Web3StatusRef)

  // To share the Connect button ref with the AccountDrawer modal so it doesn't trigger useOnClickOutside
  useEffect(() => {
    setRef(ref)
  }, [setRef])

  const accountDrawer = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.AccountDropdownButtonClicked)
    accountDrawer.toggle()
  }, [accountDrawer])

  const { hasPendingActivity, pendingActivityCount, isOnlyUnichainPendingActivity } = usePendingActivity()
  const { accountIdentifier, hasUnitag } = useAccountIdentifier()
  const showLoadingState = useShowPendingAfterDelay(hasPendingActivity, isOnlyUnichainPendingActivity)

  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  if (isConnecting && !isIFramed()) {
    return (
      <Web3StatusGeneric
        loading
        isDisabled
        onDisabledPress={handleWalletDropdownClick}
        onPress={handleWalletDropdownClick}
        ref={ref}
      >
        <AddressAndChevronContainer $loading={true}>
          <Text variant="body2" marginRight={hasUnitag ? '$spacing8' : undefined}>
            {accountIdentifier}
          </Text>
          {hasUnitag ? <Unitag size={18} /> : undefined}
        </AddressAndChevronContainer>
      </Web3StatusGeneric>
    )
  }

  if (activeAddresses.evmAddress || activeAddresses.svmAddress) {
    return (
      <Trace logPress eventOnTrigger={InterfaceEventName.MiniPortfolioToggled} properties={{ type: 'open' }}>
        <AnimatePresence exitBeforeEnter>
          {showLoadingState ? (
            <Flex key="pending" animation="125ms" enterStyle={{ opacity: 0, y: -2 }} exitStyle={{ opacity: 0, y: 2 }}>
              <Web3StatusGeneric
                isDisabled={Boolean(switchingChain)}
                data-testid={TestID.Web3StatusConnected}
                onPress={handleWalletDropdownClick}
                onDisabledPress={handleWalletDropdownClick}
                loading
                ref={ref}
                icon={undefined}
              >
                <TextStyled>
                  <Trans i18nKey="activity.pending" values={{ pendingActivityCount }} />
                </TextStyled>
              </Web3StatusGeneric>
            </Flex>
          ) : (
            <Flex key="normal" animation="125ms" enterStyle={{ opacity: 0, y: -2 }} exitStyle={{ opacity: 0, y: 2 }}>
              <Web3StatusGeneric
                isDisabled={Boolean(switchingChain)}
                data-testid={TestID.Web3StatusConnected}
                onPress={handleWalletDropdownClick}
                onDisabledPress={handleWalletDropdownClick}
                loading={false}
                ref={ref}
                icon={<StatusIcon size={24} showMiniIcons={false} />}
              >
                <AddressAndChevronContainer>
                  <Text variant="body2" marginRight={hasUnitag ? '$spacing8' : undefined}>
                    {accountIdentifier}
                  </Text>
                  {hasUnitag && <Unitag size={18} />}
                </AddressAndChevronContainer>
              </Web3StatusGeneric>
            </Flex>
          )}
        </AnimatePresence>
      </Trace>
    )
  }

  return (
    <Trace
      logPress
      eventOnTrigger={InterfaceEventName.ConnectWalletButtonClicked}
      element={ElementName.ConnectWalletButton}
    >
      {/* biome-ignore lint/correctness/noRestrictedElements: needed here */}
      <div onKeyDown={(e) => e.key === 'Enter' && handleWalletDropdownClick()}>
        <ExistingUserCTAButton ref={ref} onPress={handleWalletDropdownClick} />
      </div>
    </Trace>
  )
}

export default function Web3Status() {
  const { isOpen: recentlyConnectedModalIsOpen } = useModalState(ModalName.RecentlyConnectedModal)
  return (
    <PrefetchBalancesWrapper>
      <Popover
        placement="bottom"
        stayInFrame
        allowFlip
        open={recentlyConnectedModalIsOpen}
        offset={{ mainAxis: 8, crossAxis: -4 }}
      >
        <Popover.Trigger>
          <Web3StatusInner />
        </Popover.Trigger>
        <RecentlyConnectedModal />
      </Popover>
      <Portal>
        <PortfolioDrawer />
      </Portal>
    </PrefetchBalancesWrapper>
  )
}
