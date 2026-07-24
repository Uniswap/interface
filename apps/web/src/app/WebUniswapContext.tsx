import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { type NavigateToEarnVaultArgs, UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useSetActiveChainId } from 'uniswap/src/features/smartWallet/delegation/hooks/useSetActiveChainId'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import { useHasAccountMismatchCallback } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { MismatchContextProvider } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useGetCanSignPermits } from 'uniswap/src/features/transactions/hooks/useGetCanSignPermits'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import {
  EARN_VAULT_MODAL_QUERY_PARAM,
  EARN_VAULT_MODAL_QUERY_VALUE,
  getFiatOnRampURL,
  getPoolDetailsURL,
  type TdpChainSelection,
} from 'uniswap/src/utils/linking'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { MenuStateVariant, useMenuState } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useOpenReceiveCryptoModal } from '~/components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useConnectionStatus } from '~/features/accounts/store/hooks'
import { useAccountsStoreContext } from '~/features/accounts/store/provider'
import { useAccount } from '~/hooks/useAccount'
import { useEthersProvider } from '~/hooks/useEthersProvider'
import { useEthersSigner } from '~/hooks/useEthersSigner'
import { useGetSwapDelegationInfo } from '~/hooks/useGetSwapDelegationInfo'
import { PageType } from '~/hooks/useIsPage'
import { useModalState } from '~/hooks/useModalState'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { useOneClickSwapSetting } from '~/pages/Swap/Swap/settings/OneClickSwap'
import { serializeSwapAddressesToURLParameters } from '~/pages/Swap/Swap/state/tradeQueryParams'
import { EARN_ENTRY_POINT_QUERY_PARAM } from '~/pages/TokenDetails/components/earn/earnEntryPointQuery'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import { SwitchNetworkAction } from '~/state/popups/types'
import { useHasAlternateGasFeesByChainIdCallback } from '~/state/walletCapabilities/hooks/useHasAlternateGasFees'
import { useIsAtomicBatchingSupportedByChainIdCallback } from '~/state/walletCapabilities/hooks/useIsAtomicBatchingSupportedByChain'
import { useHasMismatchCallback, useShowMismatchToast } from '~/state/walletCapabilities/hooks/useMismatchAccount'
import { ReceiveModalState } from '~/types/receiveCryptoModal'
import { getTdpChainQueryParam } from '~/utils/params/chainQueryParam'
import { showSwitchNetworkNotification } from '~/utils/showSwitchNetworkNotification'

// Adapts useEthersProvider to fit uniswap context hook shape
function useWebProvider(chainId: number) {
  return useEthersProvider({ chainId })
}

export function WebUniswapProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <MismatchContextWrapper>
      <WebUniswapProviderInner>{children}</WebUniswapProviderInner>
    </MismatchContextWrapper>
  )
}

// Abstracts web-specific transaction flow objects for usage in cross-platform flows in the `uniswap` package.
function WebUniswapProviderInner({ children }: PropsWithChildren) {
  const signer = useEthersSigner()
  const location = useLocation()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const { chainId } = useMultichainContext()

  const { closeModal: closeSendModal } = useModalState(ModalName.Send)
  const { closeModal: closeSearchModal } = useModalState(ModalName.Search)
  const { openModal: openSendModal } = useModalState(ModalName.Send)

  const navigateToSwapFlow = useCallback(
    ({
      inputCurrencyId,
      outputCurrencyId,
      exactCurrencyField,
      exactAmountToken,
    }: {
      inputCurrencyId?: string
      outputCurrencyId?: string
      exactCurrencyField?: CurrencyField
      exactAmountToken?: string
    }) => {
      const queryParams = serializeSwapAddressesToURLParameters({
        inputTokenAddress: inputCurrencyId ? currencyIdToAddress(inputCurrencyId) : undefined,
        outputTokenAddress: outputCurrencyId ? currencyIdToAddress(outputCurrencyId) : undefined,
        chainId: inputCurrencyId ? currencyIdToChain(inputCurrencyId) : undefined,
        outputChainId: outputCurrencyId ? currencyIdToChain(outputCurrencyId) : undefined,
        exactCurrencyField,
        exactAmountToken,
      })
      navigate(`/swap${queryParams}`)
      closeSearchModal()
      accountDrawer.close()
    },
    [navigate, closeSearchModal, accountDrawer],
  )

  const navigateToPoolDetails = useCallback(
    // oxlint-disable-next-line no-shadow
    ({ poolId, chainId }: { poolId: Address; chainId: UniverseChainId }) => {
      const url = getPoolDetailsURL(poolId, chainId)
      navigate(url)
      closeSearchModal()
    },
    [navigate, closeSearchModal],
  )

  const navigateToAuction = useCallback(
    ({ auctionAddress, chainId: auctionChainId }: { auctionAddress: string; chainId: UniverseChainId }) => {
      const chainUrlParam = getChainInfo(auctionChainId).urlParam
      navigate(`/explore/auctions/${chainUrlParam}/${auctionAddress}`)
      closeSearchModal()
    },
    [navigate, closeSearchModal],
  )

  const navigateToFiatOnRamp = useCallback(
    ({ prefilledCurrency }: { prefilledCurrency?: FiatOnRampCurrency } = {}) => {
      const currencyInfo = prefilledCurrency?.currencyInfo
      navigate(
        getFiatOnRampURL({
          chainId: currencyInfo?.currency.chainId,
          currencyCode: prefilledCurrency?.meldCurrencyCode,
          currencyId: currencyInfo?.currencyId,
        }),
      )
    },
    [navigate],
  )

  const navigateToBuyOrReceiveWithEmptyWallet = useCallback(() => {
    const url = getFiatOnRampURL(chainId ?? undefined)
    navigate(url)
    closeSendModal()
  }, [navigate, chainId, closeSendModal])

  const navigateToSendFlow = useCallback(
    ({
      // oxlint-disable-next-line no-shadow
      chainId,
      currencyAddress,
      recipient,
    }: {
      chainId: UniverseChainId
      currencyAddress?: Address
      recipient?: Address
    }) => {
      const chainUrlParam = getChainInfo(chainId).urlParam
      const params = new URLSearchParams(location.search)

      openSendModal()
      closeSearchModal()

      // When we are in portfolio, we want to keep the previous state of selected network.
      // Thus, we keep the state of the `chain` parameter and append it to the new URL.
      const openingInPortfolio = location.pathname.includes(PageType.PORTFOLIO)
      const retainedNetworkParam = openingInPortfolio && params.has('chain') ? `chain=${params.get('chain')}&` : ''

      const newPathname = location.pathname === '/' ? '/send' : location.pathname
      const currencyAddressParam = currencyAddress ? `&sendCurrency=${currencyAddress}` : ''
      const recipientParam = recipient ? `&sendRecipient=${recipient}` : ''
      navigate(
        `${newPathname}?${retainedNetworkParam}sendChain=${chainUrlParam}${currencyAddressParam}${recipientParam}`,
      )
    },
    [openSendModal, closeSearchModal, navigate, location.pathname, location.search],
  )

  const navigateToReceive = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })

  // no-op until we have a share token screen on web
  const handleShareToken = useCallback((_: { currencyId: string }) => {
    noop()
  }, [])

  const navigateToTokenDetails = useCallback(
    (currencyId: string, chainSelection?: TdpChainSelection) => {
      const tokenChainId = currencyIdToChain(currencyId)
      const url = getTokenDetailsURL({
        address: currencyIdToAddress(currencyId),
        chain: tokenChainId ? toGraphQLChain(tokenChainId) : undefined,
        chainQueryParam: getTdpChainQueryParam({ selection: chainSelection, tokenChainId }),
      })
      navigate(url)
      closeSearchModal()
      accountDrawer.close()
    },
    [navigate, closeSearchModal, accountDrawer],
  )

  // Mirrors the TDP vault-share banner: route to the underlying token's TDP and auto-open the earn vault
  // modal (TokenDetailsEarnSection reads ?modal=earn-vault on load).
  const navigateToEarnVault = useCallback(
    ({ analyticsEntryPoint, vault }: NavigateToEarnVaultArgs) => {
      const tokenChainId = currencyIdToChain(vault.displayCurrencyId)
      const url = getTokenDetailsURL({
        address: currencyIdToAddress(vault.displayCurrencyId),
        chain: tokenChainId ? toGraphQLChain(tokenChainId) : undefined,
      })
      const params = new URLSearchParams({ [EARN_VAULT_MODAL_QUERY_PARAM]: EARN_VAULT_MODAL_QUERY_VALUE })
      if (analyticsEntryPoint) {
        params.set(EARN_ENTRY_POINT_QUERY_PARAM, analyticsEntryPoint)
      }
      navigate(`${url}?${params}`)
      closeSearchModal()
      accountDrawer.close()
    },
    [navigate, closeSearchModal, accountDrawer],
  )

  const getHasMismatch = useHasAccountMismatchCallback()
  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getIsUniswapXSupported = useEvent((innerChainId?: UniverseChainId) => {
    if (isPermitMismatchUxEnabled) {
      return !getHasMismatch(innerChainId)
    }
    return true
  })
  const getCanSignPermits = useGetCanSignPermits()
  const getSwapDelegationInfo = useGetSwapDelegationInfo()

  const navigateToExternalProfile = useCallback(
    ({ address }: { address: Address }) => {
      navigate(buildPortfolioUrl({ externalAddress: address }))
      closeSearchModal()
    },
    [navigate, closeSearchModal],
  )

  const { openModal } = useModalState(ModalName.DelegationMismatch)

  const handleOpenUniswapXUnsupportedModal = useEvent(() => {
    openModal()
  })

  const isBatchedSwapsFlagEnabled = useFeatureFlag(FeatureFlags.BatchedSwaps)
  const isAtomicBatchingSupportedByChain = useIsAtomicBatchingSupportedByChainIdCallback()

  const { enabled: isOneClickSwapSettingEnabled } = useOneClickSwapSetting()
  // oxlint-disable-next-line typescript/no-duplicate-type-constituents no-shadow -- biome-parity: oxlint is stricter here
  const getCanBatchTransactions = useEvent((chainId?: UniverseChainId | undefined) => {
    return Boolean(
      isBatchedSwapsFlagEnabled && isOneClickSwapSettingEnabled && chainId && isAtomicBatchingSupportedByChain(chainId),
    )
  })

  const hasAlternateGasFeesByChain = useHasAlternateGasFeesByChainIdCallback()
  // oxlint-disable-next-line typescript/no-duplicate-type-constituents no-shadow -- biome-parity: oxlint is stricter here
  const getHasAlternateGasFees = useEvent((chainId?: UniverseChainId | undefined) => {
    return Boolean(chainId && hasAlternateGasFeesByChain(chainId))
  })

  const setActiveChainId = useSetActiveChainId()

  const onSwapChainsChanged = useEvent(
    ({
      // oxlint-disable-next-line no-shadow
      chainId,
      prevChainId,
      outputChainId,
    }: {
      chainId: UniverseChainId
      outputChainId?: UniverseChainId
      prevChainId?: UniverseChainId
    }) => {
      setActiveChainId(chainId)
      showSwitchNetworkNotification({ chainId, outputChainId, prevChainId, action: SwitchNetworkAction.Swap })
    },
  )

  const accountDrawerMenu = useMenuState()

  const { isConnected } = useConnectionStatus()
  const onConnectWallet = useEvent((platform?: Platform) => {
    accountDrawer.open()

    // If a wallet is already connected, and swap prompts to connect on a specific platform,
    // then the connect platform menu should be shown
    if (platform && isConnected) {
      accountDrawerMenu.setMenuState({ variant: MenuStateVariant.CONNECT_PLATFORM, platform })
      return
    }
  })

  const navigateToAdvancedSettings = useCallback(() => {
    accountDrawer.open()
    accountDrawerMenu.setMenuState({ variant: MenuStateVariant.SETTINGS })
  }, [accountDrawer, accountDrawerMenu])

  const getTokenDetailsUrl = useEvent((currencyId: string, chainSelection?: TdpChainSelection): string => {
    const tokenChainId = currencyIdToChain(currencyId)
    return getTokenDetailsURL({
      address: currencyIdToAddress(currencyId),
      chain: tokenChainId ? toGraphQLChain(tokenChainId) : undefined,
      chainQueryParam: getTdpChainQueryParam({ selection: chainSelection, tokenChainId }),
    })
  })

  // oxlint-disable-next-line no-shadow
  const getPoolDetailsUrl = useEvent(({ poolId, chainId }: { poolId: Address; chainId: UniverseChainId }): string => {
    return getPoolDetailsURL(poolId, chainId)
  })

  const getExternalProfileUrl = useEvent(({ address }: { address: Address }): string => {
    return buildPortfolioUrl({ externalAddress: address })
  })

  const navigateToNftDetails = useNavigateToNftExplorerLink()

  useAccountChainIdEffect()

  return (
    <UniswapProvider
      signer={signer}
      useProviderHook={useWebProvider}
      useWalletDisplayName={useOnchainDisplayName}
      onSwapChainsChanged={onSwapChainsChanged}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      navigateToSwapFlow={navigateToSwapFlow}
      navigateToSendFlow={navigateToSendFlow}
      navigateToReceive={navigateToReceive}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToTokenDetails={navigateToTokenDetails}
      navigateToExternalProfile={navigateToExternalProfile}
      navigateToNftDetails={navigateToNftDetails}
      navigateToPoolDetails={navigateToPoolDetails}
      navigateToEarnVault={navigateToEarnVault}
      navigateToAuction={navigateToAuction}
      handleShareToken={handleShareToken}
      navigateToAdvancedSettings={navigateToAdvancedSettings}
      onConnectWallet={onConnectWallet}
      getCanSignPermits={getCanSignPermits}
      getSwapDelegationInfo={getSwapDelegationInfo}
      // Web executes embedded-wallet swaps via the EIP-5792 wallet_sendCalls surface (no userOp
      // swap saga), so sponsored EW swaps route to /swap_5792 rather than the /swap_4337 userOp.
      supportsUserOpSwaps={false}
      getIsUniswapXSupported={getIsUniswapXSupported}
      handleOnPressUniswapXUnsupported={handleOpenUniswapXUnsupportedModal}
      getCanBatchTransactions={getCanBatchTransactions}
      getHasAlternateGasFees={getHasAlternateGasFees}
      useAccountsStoreContextHook={useAccountsStoreContext}
      getTokenDetailsUrl={getTokenDetailsUrl}
      getPoolDetailsUrl={getPoolDetailsUrl}
      getExternalProfileUrl={getExternalProfileUrl}
    >
      {children}
    </UniswapProvider>
  )
}

const MismatchContextWrapper = React.memo(function MismatchContextWrapper({ children }: PropsWithChildren) {
  const getHasMismatch = useHasMismatchCallback()
  const account = useAccount()
  const onHasAnyMismatch = useShowMismatchToast()
  const { chains, defaultChainId, isTestnetModeEnabled } = useEnabledChains()
  return (
    <MismatchContextProvider
      mismatchCallback={getHasMismatch}
      address={account.address}
      chainId={account.chainId}
      onHasAnyMismatch={onHasAnyMismatch}
      chains={chains}
      defaultChainId={defaultChainId}
      isTestnetModeEnabled={isTestnetModeEnabled}
    >
      {children}
    </MismatchContextProvider>
  )
})

MismatchContextWrapper.displayName = 'MismatchContextWrapper'

/**
 * Sets the active chain id when the account chain id changes
 */
function useAccountChainIdEffect() {
  const currentChainId = useSelector((state: { delegation: DelegatedState }) => state.delegation.activeChainId)
  const { chainId } = useAccount()
  const { defaultChainId } = useEnabledChains()
  const accountChainId = chainId ?? defaultChainId
  const prevChainId = usePrevious(chainId)
  const setActiveChainId = useSetActiveChainId()

  useEffect(() => {
    if (!currentChainId) {
      setActiveChainId(accountChainId)
    } else if (prevChainId !== accountChainId) {
      setActiveChainId(accountChainId)
    }
  }, [accountChainId, currentChainId, prevChainId, setActiveChainId])
}
