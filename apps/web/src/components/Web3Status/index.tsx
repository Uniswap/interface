import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import PortfolioDrawer from 'components/AccountDrawer'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import StatusIcon from 'components/Identicon/StatusIcon'
import { RecentlyConnectedModal } from 'components/Web3Status/RecentlyConnectedModal'
import { useAccountIdentifier } from 'components/Web3Status/useAccountIdentifier'
import { useAccount } from 'hooks/useAccount'
import { useModalState } from 'hooks/useModalState'
import { atom, useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { RefObject, forwardRef, useCallback, useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppSelector } from 'state/hooks'
import { Button, ButtonProps, Flex, Popover, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { breakpoints } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
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
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
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
  const account = useAccount()
  const ref = useRef<HTMLDivElement>(null)
  const [, setRef] = useAtom(Web3StatusRef)

  // To share the Connect button ref with the AccountDrawer modal so it doesn't trigger useOnClickOutside
  useEffect(() => {
    setRef(ref)
  }, [setRef])

  const accountDrawer = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED)
    accountDrawer.toggle()
  }, [accountDrawer])

  const { hasPendingActivity, pendingActivityCount } = usePendingActivity()
  const { accountIdentifier, hasUnitag, hasRecent } = useAccountIdentifier()

  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  if ((account.isConnecting || account.isReconnecting) && hasRecent && !isIFramed()) {
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

  if (account.address) {
    return (
      <Trace logPress eventOnTrigger={InterfaceEventName.MINI_PORTFOLIO_TOGGLED} properties={{ type: 'open' }}>
        <Web3StatusGeneric
          isDisabled={Boolean(switchingChain)}
          data-testid={TestID.Web3StatusConnected}
          onPress={handleWalletDropdownClick}
          onDisabledPress={handleWalletDropdownClick}
          loading={hasPendingActivity}
          ref={ref}
          icon={!hasPendingActivity ? <StatusIcon size={24} showMiniIcons={false} /> : undefined}
        >
          {hasPendingActivity ? (
            <TextStyled>
              <Trans i18nKey="activity.pending" values={{ pendingActivityCount }} />
            </TextStyled>
          ) : (
            <AddressAndChevronContainer>
              <Text variant="body2" marginRight={hasUnitag ? '$spacing8' : undefined}>
                {accountIdentifier}
              </Text>
              {hasUnitag && <Unitag size={18} />}
            </AddressAndChevronContainer>
          )}
        </Web3StatusGeneric>
      </Trace>
    )
  }

  return (
    <Trace
      logPress
      eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
      element={InterfaceElementName.CONNECT_WALLET_BUTTON}
    >
      {/* eslint-disable-next-line react/forbid-elements */}
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
