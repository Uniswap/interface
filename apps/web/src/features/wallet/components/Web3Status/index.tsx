import { useEmbeddedWalletState } from '@universe/embedded-wallet'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Button, ButtonProps, Flex, Text } from '@universe/mycelium'
import { ENTER_EXIT_PRESET_CLASSES } from '@universe/mycelium/compat'
import { Unitag } from '@universe/mycelium/icons/Unitag'
import { Presence } from '@universe/mycelium/presence'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { useAtom } from 'jotai'
import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover } from 'ui/src'
import { useActiveAddresses, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { usePendingActivity } from '~/components/Activity/hooks'
import { Portal } from '~/components/Popups/Portal'
import { useHasInjectedWallets } from '~/connection/hooks/useOrderedWalletConnectors'
import { NAV_CONTROL_HEIGHT } from '~/constants/layout'
import { AccountDrawer as PortfolioDrawer } from '~/features/wallet/components/AccountDrawer'
import { StatusIcon } from '~/features/wallet/components/StatusIcon'
import { RecentlyConnectedModal } from '~/features/wallet/components/Web3Status/RecentlyConnectedModal'
import { useAccountIdentifier } from '~/features/wallet/components/Web3Status/useAccountIdentifier'
import { useShowPendingAfterDelay } from '~/features/wallet/components/Web3Status/useShowPendingAfterDelay'
import { Web3StatusRef } from '~/features/wallet/components/Web3Status/web3StatusRef'
import { useModalState } from '~/hooks/useModalState'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
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
        backgroundColor="$transparent"
        className="hover:bg-surface5-hovered"
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

const BALANCE_PILL_PROPS = {
  iconPosition: 'after',
  height: NAV_CONTROL_HEIGHT,
  pl: '$spacing12',
  pr: '$spacing6',
  gap: '$spacing8',
  borderColor: '$surface3',
  borderRadius: '$roundedFull',
} satisfies ButtonProps

function NavPortfolioBalance({ balanceUSD, isLoading }: { balanceUSD?: number; isLoading: boolean }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Text
      variant="buttonLabel3"
      color={balanceUSD ? '$neutral1' : '$neutral2'}
      loading={isLoading}
      loadingPlaceholderText="$0,000.00"
    >
      {convertFiatAmountFormatted(balanceUSD ?? 0, NumberType.PortfolioBalance)}
    </Text>
  )
}

const ExistingUserCTAButton = forwardRef<HTMLDivElement, { onPress: () => void }>(function ExistingUserCTAButton(
  { onPress },
  ref,
) {
  const { t } = useTranslation()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  const hasInjectedWallets = useHasInjectedWallets()
  const { walletAddress: embeddedWalletAddress } = useEmbeddedWalletState()
  const showGetStarted =
    isNewUserUxEnabled || (isEmbeddedWalletEnabled && !hasInjectedWallets && !embeddedWalletAddress)

  return (
    <Flex row ref={ref}>
      <Button
        fill={false}
        size="small"
        variant="branded"
        emphasis="primary"
        tabIndex={0}
        data-testid={TestID.NavConnectWalletButton}
        onPress={onPress}
      >
        {showGetStarted ? t('common.getStarted') : t('common.connect.button')}
      </Button>
    </Flex>
  )
})

function Web3StatusInner() {
  const { t } = useTranslation()
  const activeAddresses = useActiveAddresses()
  const { isConnecting } = useConnectionStatus()
  const { isTestnetModeEnabled } = useEnabledChains()
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
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
  // Same params as the drawer header, so both share one cache entry.
  const portfolioTotalValue = usePortfolioTotalValue({
    evmAddress: activeAddresses.evmAddress,
    svmAddress: activeAddresses.svmAddress,
    enabled: isNewUserUxEnabled,
  })
  // A failed first fetch drops back to the bare avatar rather than leaving the pill on a skeleton.
  const isBalancePillVisible = isNewUserUxEnabled && !(portfolioTotalValue.error && !portfolioTotalValue.data)

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
                // Legacy: trims the inset around the avatar's own whitespace. Right: the avatar sits as far from
                // the screen edge as the logo does on the left. Left: with the nav row's $md gap dropped beside
                // the search icon, the two land 20px apart; the testnet pill sits between them and keeps
                // the row gap, so it keeps the full left inset.
                {...(isBalancePillVisible
                  ? BALANCE_PILL_PROPS
                  : { $md: isTestnetModeEnabled ? { pr: '$spacing4' } : { pl: '$spacing1', pr: '$spacing4' } })}
              >
                {isBalancePillVisible ? (
                  <NavPortfolioBalance
                    balanceUSD={portfolioTotalValue.data?.balanceUSD}
                    isLoading={!portfolioTotalValue.data && portfolioTotalValue.isPending}
                  />
                ) : isNewUserUxEnabled ? undefined : (
                  <AddressAndChevronContainer>
                    <Text variant="body2" marginRight={hasUnitag ? '$spacing8' : undefined}>
                      {accountIdentifier}
                    </Text>
                    {hasUnitag && <Unitag size={18} />}
                  </AddressAndChevronContainer>
                )}
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
