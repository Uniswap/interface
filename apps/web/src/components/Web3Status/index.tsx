import { useEmbeddedWalletState } from '@universe/embedded-wallet'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { ENTER_EXIT_PRESET_CLASSES } from '@universe/mycelium/compat'
import { Presence } from '@universe/mycelium/presence'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { useAtom } from 'jotai'
import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonProps, Popover } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { useActiveAddresses, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { ElementName, InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { AccountDrawer as PortfolioDrawer } from '~/components/AccountDrawer'
import { usePendingActivity } from '~/components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { Portal } from '~/components/Popups/Portal'
import { StatusIcon } from '~/components/StatusIcon'
import { RecentlyConnectedModal } from '~/components/Web3Status/RecentlyConnectedModal'
import { useAccountIdentifier } from '~/components/Web3Status/useAccountIdentifier'
import { useShowPendingAfterDelay } from '~/components/Web3Status/useShowPendingAfterDelay'
import { Web3StatusRef } from '~/components/Web3Status/web3StatusRef'
import { useHasInjectedWallets } from '~/features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useModalState } from '~/hooks/useModalState'
import { isIFramed } from '~/utils/isIFramed'

const TextStyled = styled('span', {
  platform: 'web',
  base: 'flex-[1_1_auto] text-ellipsis whitespace-nowrap text-[1rem] w-fit font-[485] mr-[0px] text-neutral1',
})

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

const AddressAndChevronContainer = styled('div', {
  platform: 'web',
  base: 'flex items-center media-xl:hidden',
  variants: {
    $loading: { true: 'opacity-50', false: '' },
  },
  defaultVariants: { $loading: false },
})

const ExistingUserCTAButton = forwardRef<HTMLDivElement, { onPress: () => void }>(function ExistingUserCTAButton(
  { onPress },
  ref,
) {
  const { t } = useTranslation()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const hasInjectedWallets = useHasInjectedWallets()
  const { walletAddress: embeddedWalletAddress } = useEmbeddedWalletState()
  const showGetStarted = isEmbeddedWalletEnabled && !hasInjectedWallets && !embeddedWalletAddress

  return (
    <Button
      fill={false}
      size="small"
      variant="branded"
      emphasis="primary"
      tabIndex={0}
      data-testid={TestID.NavConnectWalletButton}
      ref={ref}
      onPress={onPress}
    >
      {showGetStarted ? t('common.getStarted') : t('common.connect.button')}
    </Button>
  )
})

function Web3StatusInner() {
  const { t } = useTranslation()
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

  const { hasPendingActivity, pendingActivityCount, hasL1PendingActivity } = usePendingActivity()
  const { accountIdentifier, hasUnitag } = useAccountIdentifier()
  const showLoadingState = useShowPendingAfterDelay({
    hasPendingActivity,
    hasL1PendingActivity,
  })

  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  if (isConnecting && !isIFramed()) {
    return (
      <Web3StatusGeneric loading onPress={handleWalletDropdownClick} ref={ref}>
        <AddressAndChevronContainer $loading={true}>
          <Text variant="body2" marginRight={hasUnitag ? '$spacing8' : undefined}>
            {accountIdentifier}
          </Text>
          {hasUnitag ? (
            <Flex pt="$spacing2">
              <Unitag size={18} />
            </Flex>
          ) : undefined}
        </AddressAndChevronContainer>
      </Web3StatusGeneric>
    )
  }

  if (activeAddresses.evmAddress || activeAddresses.svmAddress) {
    return (
      <Trace logPress element={ElementName.AccountDrawerButton}>
        <Presence exitBeforeEnter>
          {showLoadingState ? (
            <Flex key="pending" className={ENTER_EXIT_PRESET_CLASSES.fadeInOut}>
              <Web3StatusGeneric
                data-testid={TestID.Web3StatusConnected}
                onPress={handleWalletDropdownClick}
                onDisabledPress={handleWalletDropdownClick}
                loading
                ref={ref}
                icon={undefined}
              >
                <TextStyled>{t('activity.pending', { pendingActivityCount })}</TextStyled>
              </Web3StatusGeneric>
            </Flex>
          ) : (
            <Flex key="normal" className={ENTER_EXIT_PRESET_CLASSES.fadeInOut}>
              <Web3StatusGeneric
                data-testid={TestID.Web3StatusConnected}
                onPress={handleWalletDropdownClick}
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
        </Presence>
      </Trace>
    )
  }

  return (
    <Trace
      logPress
      eventOnTrigger={InterfaceEventName.ConnectWalletButtonClicked}
      element={ElementName.ConnectWalletButton}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- needed here */}
      <div onKeyDown={(e) => e.key === 'Enter' && handleWalletDropdownClick()}>
        <ExistingUserCTAButton ref={ref} onPress={handleWalletDropdownClick} />
      </div>
    </Trace>
  )
}

export function Web3Status() {
  const { isOpen: recentlyConnectedModalIsOpen } = useModalState(ModalName.RecentlyConnectedModal)
  return (
    <>
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
    </>
  )
}
