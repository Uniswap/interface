import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import PortfolioDrawer from 'components/AccountDrawer'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import StatusIcon from 'components/Identicon/StatusIcon'
import { useAccountIdentifier } from 'components/Web3Status/useAccountIdentifier'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAccount } from 'hooks/useAccount'
import { atom, useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { RefObject, forwardRef, useCallback, useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppSelector } from 'state/hooks'
import { Button, ButtonProps, Flex } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { breakpoints } from 'ui/src/theme'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupNameWithLoading, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isIFramed } from 'utils/isIFramed'

const TextStyled = styled.span<{ marginRight?: number }>`
  flex: 1 1 auto;
  overflow: hidden;
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

  const { value: accountsCTAExperimentGroup } = useExperimentGroupNameWithLoading(Experiments.AccountCTAs)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp || isEmbeddedWalletEnabled
  const isLogIn =
    accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount && !isEmbeddedWalletEnabled

  return (
    <Button
      fill={false}
      size="small"
      variant="branded"
      emphasis="secondary"
      tabIndex={0}
      data-testid="navbar-connect-wallet"
      ref={ref}
      onPress={onPress}
    >
      {isSignIn ? t('nav.signIn.button') : isLogIn ? t('nav.logIn.button') : t('common.connect.button')}
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

  const { isLoading: isExperimentGroupNameLoading } = useExperimentGroupNameWithLoading(Experiments.AccountCTAs)

  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  if (((account.isConnecting || account.isReconnecting) && hasRecent && !isIFramed()) || isExperimentGroupNameLoading) {
    return (
      <Web3StatusGeneric loading isDisabled onPress={handleWalletDropdownClick} ref={ref}>
        <AddressAndChevronContainer $loading={true}>
          <TextStyled marginRight={hasUnitag ? 8 : undefined}>{accountIdentifier}</TextStyled>
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
          data-testid="web3-status-connected"
          onPress={handleWalletDropdownClick}
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
              <TextStyled marginRight={hasUnitag ? 8 : undefined}>{accountIdentifier}</TextStyled>
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
  return (
    <PrefetchBalancesWrapper>
      <Web3StatusInner />
      <Portal>
        <PortfolioDrawer />
      </Portal>
    </PrefetchBalancesWrapper>
  )
}
