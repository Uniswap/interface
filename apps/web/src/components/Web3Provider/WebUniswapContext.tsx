import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useMenuState } from 'components/AccountDrawer/menuState'
import { SwitchNetworkAction } from 'components/Popups/types'
import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useConnectionStatus } from 'features/accounts/store/hooks'
import { useAccountsStoreContext } from 'features/accounts/store/provider'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useModalState } from 'hooks/useModalState'
import { useOneClickSwapSetting } from 'pages/Swap/settings/OneClickSwap'
import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { serializeSwapAddressesToURLParameters } from 'state/swap/hooks'
import { useIsAtomicBatchingSupportedByChainIdCallback } from 'state/walletCapabilities/hooks/useIsAtomicBatchingSupportedByChain'
import { useHasMismatchCallback, useShowMismatchToast } from 'state/walletCapabilities/hooks/useMismatchAccount'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useSetActiveChainId } from 'uniswap/src/features/smartWallet/delegation/hooks/useSetActiveChainId'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import { useHasAccountMismatchCallback } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { MismatchContextProvider } from 'uniswap/src/features/smartWallet/mismatch/MismatchContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useGetCanSignPermits } from 'uniswap/src/features/transactions/hooks/useGetCanSignPermits'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL, getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'
import { showSwitchNetworkNotification } from 'utils/showSwitchNetworkNotification'

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
  const account = useAccount()

  // Check if current wallet can pay gas fees in any token (e.g., Porto wallet)
  const getCanPayGasInAnyToken = useCallback(() => {
    return account.connector?.id === CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID
  }, [account.connector?.id])
  const signer = useEthersSigner()
  const location = useLocation()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const navigateToFiatOnRamp = useCallback(() => navigate(`/buy`, { replace: true }), [navigate])

  const { closeModal: closeSearchModal } = useModalState(ModalName.Search)
  const { openModal: openSendModal } = useModalState(ModalName.Send)

  const navigateToSwapFlow = useCallback(
    ({ inputCurrencyId, outputCurrencyId }: { inputCurrencyId?: string; outputCurrencyId?: string }) => {
      const queryParams = serializeSwapAddressesToURLParameters({
        inputTokenAddress: inputCurrencyId ? currencyIdToAddress(inputCurrencyId) : undefined,
        outputTokenAddress: outputCurrencyId ? currencyIdToAddress(outputCurrencyId) : undefined,
        chainId: inputCurrencyId ? currencyIdToChain(inputCurrencyId) : undefined,
        outputChainId: outputCurrencyId ? currencyIdToChain(outputCurrencyId) : undefined,
      })
      navigate(`/swap${queryParams}`, { replace: true })
      closeSearchModal()
      accountDrawer.close()
    },
    [navigate, closeSearchModal, accountDrawer],
  )

  const navigateToPoolDetails = useCallback(
    ({ poolId, chainId }: { poolId: Address; chainId: UniverseChainId }) => {
      const url = getPoolDetailsURL(poolId, chainId)
      navigate(url)
      closeSearchModal()
    },
    [navigate, closeSearchModal],
  )

  const navigateToSendFlow = useCallback(
    ({ chainId, currencyAddress }: { chainId: UniverseChainId; currencyAddress?: Address }) => {
      const chainUrlParam = getChainInfo(chainId).urlParam
      openSendModal()
      closeSearchModal()
      accountDrawer.close()

      const newPathname = location.pathname === '/' ? '/send' : location.pathname
      const currencyAddressParam = currencyAddress ? `&sendCurrency=${currencyAddress}` : ''
      navigate(`${newPathname}?sendChain=${chainUrlParam}${currencyAddressParam}`, {
        replace: true,
      })
    },
    [openSendModal, closeSearchModal, accountDrawer, navigate, location],
  )

  const navigateToReceive = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })

  // no-op until we have a share token screen on web
  const handleShareToken = useCallback((_: { currencyId: string }) => {
    noop()
  }, [])

  const navigateToTokenDetails = useCallback(
    async (currencyId: string) => {
      const url = getTokenDetailsURL({
        address: currencyIdToAddress(currencyId),
        chain: currencyIdToChain(currencyId) ?? undefined,
      })
      navigate(url)
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

  // no-op until we have an external profile screen on web
  const navigateToExternalProfile = useCallback((_: { address: Address }) => noop(), [])

  const navigateToNftCollection = useCallback((args: { collectionAddress: Address; chainId: UniverseChainId }) => {
    window.open(
      `https://opensea.io/assets/${getChainInfo(
        args.chainId,
      ).backendChain.chain.toLowerCase()}/${args.collectionAddress}`,
      '_blank',
      'noopener,noreferrer',
    )
  }, [])

  const { openModal } = useModalState(ModalName.DelegationMismatch)

  const handleOpenUniswapXUnsupportedModal = useEvent(() => {
    openModal()
  })

  const isBatchedSwapsFlagEnabled = useFeatureFlag(FeatureFlags.BatchedSwaps)
  const isAtomicBatchingSupportedByChain = useIsAtomicBatchingSupportedByChainIdCallback()

  const { enabled: isOneClickSwapSettingEnabled } = useOneClickSwapSetting()
  const getCanBatchTransactions = useEvent((chainId?: UniverseChainId | undefined) => {
    return Boolean(
      isBatchedSwapsFlagEnabled && isOneClickSwapSettingEnabled && chainId && isAtomicBatchingSupportedByChain(chainId),
    )
  })

  const setActiveChainId = useSetActiveChainId()

  const onSwapChainsChanged = useEvent(
    ({
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
      navigateToTokenDetails={navigateToTokenDetails}
      navigateToExternalProfile={navigateToExternalProfile}
      navigateToNftCollection={navigateToNftCollection}
      navigateToNftDetails={navigateToNftDetails}
      navigateToPoolDetails={navigateToPoolDetails}
      handleShareToken={handleShareToken}
      onConnectWallet={onConnectWallet}
      getCanSignPermits={getCanSignPermits}
      getIsUniswapXSupported={getIsUniswapXSupported}
      handleOnPressUniswapXUnsupported={handleOpenUniswapXUnsupportedModal}
      getCanBatchTransactions={getCanBatchTransactions}
      useAccountsStoreContextHook={useAccountsStoreContext}
      getCanPayGasInAnyToken={getCanPayGasInAnyToken}
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
